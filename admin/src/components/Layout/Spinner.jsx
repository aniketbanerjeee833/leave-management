const Spinner = ({ size = "md", text = "Loading..." }) => {
  // Different size options
  const sizeClasses = {
    sm: "w-6 h-6 border-2",
    md: "w-10 h-10 border-4",
    lg: "w-16 h-16 border-4",
  };

  return (
    <div className="flex flex-col justify-center items-center h-screen text-center gap-4">
      <div
        className={`animate-spin rounded-full border-t-transparent border-blue-500 ${sizeClasses[size]}`}
      ></div>
      <p className="text-gray-600 text-sm sm:text-base">{text}</p>
    </div>
  );
};

export default Spinner;
