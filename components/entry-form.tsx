type Option = {
  value: string;
  label: string;
  subtitle: string;
};

type Props = {
  title: string;
  subtitle: string;
  amountLabel?: string;
  options: Option[];
  action: (formData: FormData) => void | Promise<void>;
  showDueDate?: boolean;
};

export function EntryForm({ title, subtitle, amountLabel = "Amount", options, action, showDueDate = false }: Props) {
  return (
    <form action={action} className="rounded-lg border border-amber-200 bg-white p-4 shadow-sm">
      <div className="mb-4">
        <h2 className="text-xl font-black text-[#1f271f]">{title}</h2>
        <p className="text-sm font-semibold text-[#6f6a60]">{subtitle}</p>
      </div>
      <div className="grid gap-3">
        <label className="grid gap-2 text-sm font-bold text-[#384238]">
          Entry type
          <select
            name="type"
            className="tap-target rounded-md border border-stone-300 bg-white px-3 text-base font-bold focus:outline-none focus:ring-2 focus:ring-[#16803c]"
            required
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label} - {option.subtitle}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-bold text-[#384238]">
          {amountLabel}
          <input
            name="amount"
            type="number"
            min="1"
            step="0.01"
            inputMode="decimal"
            placeholder="₹ amount"
            className="tap-target rounded-md border border-stone-300 bg-white px-3 text-lg font-black focus:outline-none focus:ring-2 focus:ring-[#16803c]"
            required
          />
        </label>
        {showDueDate ? (
          <label className="grid gap-2 text-sm font-bold text-[#384238]">
            Due date
            <input
              name="dueDate"
              type="date"
              className="tap-target rounded-md border border-stone-300 bg-white px-3 text-base font-bold focus:outline-none focus:ring-2 focus:ring-[#16803c]"
            />
          </label>
        ) : null}
        <label className="grid gap-2 text-sm font-bold text-[#384238]">
          Short note
          <textarea
            name="description"
            rows={2}
            placeholder="Example: atta, tel, biscuit"
            className="rounded-md border border-stone-300 bg-white px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#16803c]"
          />
        </label>
        <button
          type="submit"
          className="tap-target rounded-md bg-[#16803c] px-5 py-3 text-lg font-black text-white shadow-sm hover:bg-[#11652f] focus:outline-none focus:ring-2 focus:ring-[#f59e0b]"
        >
          Save Entry
        </button>
      </div>
    </form>
  );
}
