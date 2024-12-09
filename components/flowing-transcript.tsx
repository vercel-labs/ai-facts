import React, { useEffect, useRef } from "react";
import * as Tooltip from "@radix-ui/react-tooltip";
import { TooltipRoot, TooltipTrigger } from "./tooltip-root";
import Link from "next/link";
import { VercelIcon, MasonryIcon } from "./icons";
import { SpeechIcon } from "lucide-react";
import { Statement, ValidatedStatement } from "@/utils/schemas";
import { TalkingIndicator } from "./loading-indicator";

interface FlowingTranscriptProps {
  unprocessed: string | undefined;
  statements: Statement[];
  isTalking: boolean;
}

export default function FlowingTranscript({
  statements,
  isTalking,
  unprocessed,
}: FlowingTranscriptProps) {
  const transcriptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [statements]);

  const getBackgroundColor = (item: ValidatedStatement) => {
    if (item.type === "non-checkable") return "bg-zinc-50 dark:bg-black";
    switch (item.accuracy) {
      case "true":
        return "bg-green-50 dark:bg-green-900";
      case "dubious":
        return "bg-yellow-50 dark:bg-yellow-900";
      case "obviously-fake":
        return "bg-red-50 dark:bg-red-900";
      default:
        return "bg-zinc-50 dark:bg-zinc-800";
    }
  };

  return (
    <Tooltip.Provider>
      <div className="w-full p-4 md:p-6 bg-background rounded-lg shadow-lg">
        <div ref={transcriptRef} className="h-[68vh] sm:h-[79vh] overflow-y-auto ">
          {statements.length === 0 && !isTalking ? (
            <div className="h-full flex flex-col items-center justify-center space-y-4 px-4">
              <div className="">
                <div className="">
                  <p className="flex flex-row justify-center gap-4 items-center text-zinc-900 dark:text-zinc-50">
                    <VercelIcon size={24} />
                    <span>+</span>
                    <SpeechIcon className="h-8 w-8" />
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-center max-w-[400px]">
                <h3 className="font-semibold text-xl">Start Speaking</h3>
                <p className="text-muted-foreground">
                  Your words will be transcribed and fact-checked in real-time
                  using AI
                </p>
              </div>
              <div className="text-center text-sm text-muted-foreground">
                Learn more about{" "}
                <Link
                  className="text-primary underline-offset-4 hover:underline"
                  href="https://sdk.vercel.ai/"
                  target="_blank"
                >
                  the AI SDK
                </Link>
              </div>
            </div>
          ) : (
            <h2 className="text-muted-foreground uppercase font-medium text-xs mb-4 text-center">
              Transcript
            </h2>
          )}
          <div className="flex flex-wrap font-mono text-sm leading-relaxed">
            {statements.map((item, index) => (
              <div key={index} className="animate-fade-in">
                <TooltipRoot>
                  <TooltipTrigger asChild>
                    <span
                      className={`inline-block mb-2 mx-1 px-1 py-1 rounded cursor-help ${item.result ? getBackgroundColor(item.result) : "opacity-40"} transition-all ease-in-out duration-300`}
                    >
                      {item.text}
                    </span>
                  </TooltipTrigger>
                  <Tooltip.Portal>
                    <Tooltip.Content
                      className="bg-background p-2 rounded shadow-lg border border-border max-w-xs"
                      sideOffset={5}
                    >
                      {item.result && item.result.type === "checkable" ? (
                        item.result.reasoning ? (
                          <>
                            <p className="text-sm mb-1">
                              {item.result.reasoning}
                            </p>
                            <p
                              className={`text-xs font-semibold ${
                                item.result.accuracy === "true"
                                  ? "text-green-600"
                                  : item.result.accuracy === "dubious"
                                    ? "text-yellow-600"
                                    : "text-red-600"
                              }`}
                            >
                              {item.result.accuracy?.toUpperCase()}
                            </p>
                          </>
                        ) : (
                          <p className="text-sm">Processing...</p>
                        )
                      ) : (
                        <p className="text-sm">Non-checkable statement</p>
                      )}
                      <Tooltip.Arrow className="fill-background" />
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </TooltipRoot>
              </div>
            ))}
            {isTalking && unprocessed && <TalkingIndicator />}
          </div>
        </div>
      </div>
    </Tooltip.Provider>
  );
}
