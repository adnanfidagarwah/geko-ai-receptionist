const colorMap = {
  blue: { bg: "bg-blue-100", text: "text-blue-500" },
  green: { bg: "bg-green-100", text: "text-green-500" },
  red: { bg: "bg-red-100", text: "text-red-500" },
  orange: { bg: "bg-orange-100", text: "text-orange-500" },
  purple: { bg: "bg-purple-100", text: "text-purple-500" },
  gray: { bg: "bg-gray-200", text: "text-gray-500" },
};

export default function MiniStat({ title, value, icon: Icon, color }) {
  const colors = colorMap[color] || colorMap.blue;

  return (
    <div className="flex flex-col justify-between rounded-xl border bg-white p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-600">{title}</p>
        {Icon && (
          <div className={`h-8 w-8 flex items-center justify-center rounded-full ${colors.bg}`}>
            <Icon className={`h-5 w-5 ${colors.text}`} />
          </div>
        )}
      </div>
      <p className={`mt-3 text-2xl font-bold ${colors.text}`}>{value}</p>
    </div>
  );
};

