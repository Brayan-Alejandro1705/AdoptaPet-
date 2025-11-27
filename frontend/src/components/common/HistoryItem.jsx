export default function HistoryItem({ icon, title, text, date, color }) {
  return (
    <div className={`bg-${color}-50 border-l-4 border-${color}-500 rounded-lg p-6`}>
      <div className="flex items-start gap-4">
        <div className="text-3xl">{icon}</div>

        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-800 mb-1">{title}</h3>
          <p className="text-gray-700">{text}</p>
          <p className="text-gray-500 text-sm mt-2">{date}</p>
        </div>
      </div>
    </div>
  );
}
