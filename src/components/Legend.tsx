'use client';

const items = [
  { color: 'bg-green-700', label: '强候选', textClass: 'text-white' },
  { color: 'bg-green-200', label: '多数有空' },
  { color: 'bg-yellow-200', label: '部分有空' },
  { color: 'bg-red-200', label: '多数忙碌' },
  { color: 'bg-gray-200', label: '无人回应' },
];

export default function Legend() {
  return (
    <div className="flex flex-wrap gap-3 px-1 py-2 text-xs text-gray-600">
      {items.map(item => (
        <div key={item.label} className="flex items-center gap-1.5">
          <span className={`w-3 h-3 rounded-sm ${item.color}`} />
          <span>{item.label}</span>
        </div>
      ))}
      <div className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-sm bg-green-200 border border-dashed border-green-600" />
        <span>回应少</span>
      </div>
    </div>
  );
}
