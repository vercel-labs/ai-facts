"use client";

import React, { useState, useEffect, useRef } from "react";
import * as Tooltip from "@radix-ui/react-tooltip";
import { Mic } from "lucide-react";
import FlowingTranscript from "./flowing-transcript";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";

import {
  LiveConnectionState,
  LiveTranscriptionEvent,
  LiveTranscriptionEvents,
  useDeepgram,
} from "@/app/context/DeepgramContextProvider";
import {
  MicrophoneEvents,
  MicrophoneState,
  useMicrophone,
} from "@/app/context/MicrophoneContextProvider";
import { toast } from "sonner";
import { Statement, ValidatedStatement } from "@/utils/schemas";
import { splitIntoStatements } from "@/lib/utils";
import { GitIcon, VercelIcon } from "./icons";
import Link from "next/link";

export default function AppLayout() {
  // Core state
  const [isListening, setIsListening] = useState(true);
  const [currentPhrase, setCurrentPhrase] = useState<string>("");
  const [statements, setStatements] = useState<Statement[]>([]);
  const [talking, setIsTalking] = useState(false);
  const statementsRef = useRef<Statement[]>([]);
  useEffect(() => {
    statementsRef.current = statements;
  }, [statements]);

  // Keep track of statement index
  const statementIndex = useRef<number>(0);

  // Deepgram and microphone hooks
  const { connection, connectToDeepgram, connectionState, error } =
    useDeepgram();
  const {
    setupMicrophone,
    microphone,
    startMicrophone,
    microphoneState,
    stopMicrophone,
  } = useMicrophone();

  const captionTimeout = useRef<NodeJS.Timeout>();
  const keepAliveInterval = useRef<NodeJS.Timeout>();
  const unfinishedTextRef = useRef<string>("");
  const lastTranscriptTime = useRef<number>(Date.now());
  const pauseTimeout = useRef<NodeJS.Timeout>();

  const createNewStatement = (text: string) => {
    return {
      text: text.trim(),
      timestamp: Date.now(),
      processed: false,
      index: statementIndex.current++,
    };
  };

  const processStatement = async (statement: Statement) => {
    try {
      const result = await checkFakeNews(statement.text);
      if (result.accuracy === "obviously-fake") {
        const audio = new Audio(
          "https://ztaacy9ly66axcws.public.blob.vercel-storage.com/buzzer-short-0SHYV4jcWHzWWfMFHizflIz79Byecx.wav",
        );
        audio.volume = 0.1;
        audio.play();
      }
      statement.processed = true;
      statement.result = result;
      return statement;
    } catch (error) {
      console.error("Error processing statement:", error);
      return statement;
    }
  };

  const createStatementFromUnfinished = () => {
    if (unfinishedTextRef.current) {
      const completeStatement = unfinishedTextRef.current + ".";
      const newStatement = createNewStatement(completeStatement);
      setStatements((prev) => [...prev, newStatement]);
      processStatement(newStatement).then((processedStatement) => {
        setStatements((prev) =>
          prev.map((s) =>
            s.index === processedStatement.index ? processedStatement : s,
          ),
        );
      });
      unfinishedTextRef.current = "";
    }
  };

  const checkFakeNews = async (
    statement: string,
  ): Promise<ValidatedStatement> => {
    try {
      const response = await fetch(`/api/validate-statement`, {
        body: JSON.stringify({
          statement,
          transcript: statementsRef.current.map((s) => s.text).join(" "),
        }),
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      return response.json();
    } catch (error) {
      toast.error("Error validating statement", {
        position: "top-center",
        richColors: true,
      });
      throw error;
    }
  };

  useEffect(() => {
    setupMicrophone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isListening) {
      timer = setTimeout(() => {
        setIsListening(false);
        toast.warning("Listening ended", {
          description: "The 3-minute recording limit was reached",
          richColors: true,
        });
      }, 180 * 1000);
    } else {
      // When stopping listening, process any remaining unfinished text
      createStatementFromUnfinished();
    }
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isListening]);

  useEffect(() => {
    if (microphoneState === MicrophoneState.Ready) {
      connectToDeepgram({
        model: "nova-2",
        interim_results: true,
        smart_format: true,
        endpointing: 2500,
        filler_words: true,
        keywords: [
          "Next.js",
          "React",
          "Vercel",
          "Guillermo",
          "Guillermo Rauch",
          "Socket.io",
        ],
      });
      toast.info("Setting up environment", {
        position: "top-center",
        richColors: true,
        description: "Please wait while your microphone is set up.",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [microphoneState]);

  useEffect(() => {
    if (!microphone || !connection) return;

    const onData = (e: BlobEvent) => {
      if (e.data.size > 0) {
        connection?.send(e.data);
      }
    };

    const onTranscript = (data: LiveTranscriptionEvent) => {
      const { is_final: isFinal } = data;
      const thisCaption = data.channel.alternatives[0].transcript;

      if (thisCaption) {
        setIsTalking(true);
        setCurrentPhrase(thisCaption);
        lastTranscriptTime.current = Date.now();

        clearTimeout(pauseTimeout.current);
        pauseTimeout.current = setTimeout(() => {
          if (Date.now() - lastTranscriptTime.current >= 3000) {
            createStatementFromUnfinished();
          }
        }, 3000);

        if (isFinal) {
          setIsTalking(false);
          // Update both state and ref for unfinished text
          const updatedText = (
            unfinishedTextRef.current +
            " " +
            thisCaption
          ).trim();
          unfinishedTextRef.current = updatedText;

          // Find complete statements
          const completeStatements = splitIntoStatements(updatedText);

          if (completeStatements.length > 0) {
            const newStatements = completeStatements.map(createNewStatement);
            setStatements((prev) => [...prev, ...newStatements]);

            // Process each new complete statement
            newStatements.forEach(async (statement) => {
              const processedStatement = await processStatement(statement);
              setStatements((prev) =>
                prev.map((s) =>
                  s.index === processedStatement.index ? processedStatement : s,
                ),
              );
            });

            // Keep any remaining text that doesn't end with punctuation
            const remainingText = updatedText.match(/[^.!?]+$/)?.[0]?.trim();
            unfinishedTextRef.current = remainingText || "";
          } else {
            // If no complete statements, add to unfinished text
            unfinishedTextRef.current = updatedText;
          }

          clearTimeout(captionTimeout.current);
          captionTimeout.current = setTimeout(() => {
            setCurrentPhrase("");
          }, 3000);
        }
      }
    };

    if (connectionState === LiveConnectionState.OPEN && isListening) {
      connection.addListener(LiveTranscriptionEvents.Transcript, onTranscript);
      microphone.addEventListener(MicrophoneEvents.DataAvailable, onData);
      startMicrophone();
    }

    if (connectionState === LiveConnectionState.OPEN && !isListening) {
      stopMicrophone();
    }

    return () => {
      connection.removeListener(
        LiveTranscriptionEvents.Transcript,
        onTranscript,
      );
      microphone.removeEventListener(MicrophoneEvents.DataAvailable, onData);
      clearTimeout(captionTimeout.current);
      clearTimeout(pauseTimeout.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectionState, isListening]);

  useEffect(() => {
    if (!connection) return;

    if (
      microphoneState !== MicrophoneState.Open &&
      connectionState === LiveConnectionState.OPEN
    ) {
      connection.keepAlive();
      keepAliveInterval.current = setInterval(() => {
        connection.keepAlive();
      }, 10000);
    } else {
      clearInterval(keepAliveInterval.current);
    }

    return () => clearInterval(keepAliveInterval.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [microphoneState, connectionState]);

  const toggleListening = () => setIsListening(!isListening);

  useEffect(() => {
    if (
      microphoneState === MicrophoneState.Open &&
      connectionState === LiveConnectionState.OPEN
    ) {
      setIsListening(true);
      toast.success("AI Facts is now listening.", {
        position: "top-center",
        richColors: true,
      });
    }
    if (
      microphoneState === MicrophoneState.Paused &&
      connectionState === LiveConnectionState.OPEN
    ) {
      setIsListening(false);
      toast.warning("AI Facts is no longer listening.", {
        position: "top-center",
        richColors: true,
      });
    }
  }, [microphoneState, connectionState]);

  useEffect(() => {
    if (error) {
      toast.error("Connection Error", {
        description: "Please try again later.",
        position: "top-center",
        richColors: true,
      });
    }
  }, [error]);

  return (
    <div className="min-h-screen bg-muted p-4 relative">
      <div className="max-w-2xl w-full mx-auto flex flex-col items-center">
        <div className="flex justify-end w-full h-full space-x-2 mb-4">
          <Tooltip.Provider>
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <Button
                  disabled={
                    connectionState !== LiveConnectionState.OPEN ||
                    microphoneState === MicrophoneState.NotSetup
                  }
                  variant="outline"
                  size="icon"
                  onClick={toggleListening}
                  aria-label={
                    isListening ? "Stop listening" : "Start listening"
                  }
                >
                  {isListening &&
                  microphoneState === MicrophoneState.Open &&
                  connectionState === LiveConnectionState.OPEN ? (
                    <Mic size={20} className="text-red-500 animate-pulse" />
                  ) : (
                    <Mic size={20} />
                  )}
                </Button>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content className="bg-background p-2 rounded shadow-lg border border-border">
                  <p>{isListening ? "Stop listening" : "Start listening"}</p>
                  <Tooltip.Arrow className="fill-background" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          </Tooltip.Provider>
        </div>
        <FlowingTranscript
          statements={statements}
          unprocessed={[unfinishedTextRef.current, currentPhrase].join(" ")}
          isTalking={talking}
        />
        <motion.div
          className="flex flex-row gap-4 items-center justify-between fixed bottom-6 text-xs"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <Link
            target="_blank"
            href="https://github.com/vercel-labs/ai-facts"
            className="flex flex-row gap-2 items-center border px-2 py-1.5 rounded-md bg-white hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            <GitIcon />
            View Source Code
          </Link>

          <Link
            target="_blank"
            href="https://vercel.com/templates/next.js/ai-facts"
            className="flex flex-row gap-2 items-center bg-zinc-900 px-2 py-1.5 rounded-md text-zinc-50 hover:bg-zinc-950 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-50"
          >
            <VercelIcon size={14} />
            Deploy with Vercel
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
