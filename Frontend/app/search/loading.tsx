export default function Loading() {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-900">
      <div className="relative w-16 h-16">
        {/* Outer ring */}
        <div className="absolute inset-0 border-4 border-gray-700 rounded-full"></div>
        {/* Animated spinning ring */}
        <div className="absolute inset-0 border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
      </div>
    </div>
  );
}
