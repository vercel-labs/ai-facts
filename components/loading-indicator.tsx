export function TalkingIndicator() {
  return (
    <div className="flex items-center h-full mt-1 space-x-2 rounded-full py-2 px-4 w-fit animate-fade-in-fade-out">
      <div className="w-2 h-2 bg-gray-300 dark:bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <div className="w-2 h-2 bg-gray-300 dark:bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
      <div className="w-2 h-2 bg-gray-300 dark:bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
      <span className="sr-only">User is typing</span>
    </div>
  )
}
