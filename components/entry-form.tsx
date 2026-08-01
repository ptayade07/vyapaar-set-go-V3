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
        <div
          className={`grid gap-2 ${options.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}
          role="radiogroup"
          aria-label="Entry type"
        >
          {options.map((option, index) => (
            <label
              key={option.value}
              data-testid={`entry-type-${option.value}`}
              className="tap-target block cursor-pointer rounded-lg border-2 border-stone-300 bg-white px-3 py-3 text-left font-black text-[#1f271f] transition-colors hover:border-[#16803c] has-[:checked]:border-[#16803c] has-[:checked]:bg-[#16803c] has-[:checked]:text-white has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#16803c]"
            >
              <input
                type="radio"
                name="type"
                value={option.value}
                defaultChecked={index === 0}
                className="sr-only"
              />
              <span className="block text-base">{option.label}</span>
              <span className="block text-xs font-semibold text-current/60">{option.subtitle}</span>
            </label>
          ))}
        </div>
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
          className="tap-target rounded-md bg-[#f59e0b] px-5 py-3 text-lg font-black text-[#1f271f] shadow-sm hover:bg-[#e08e00] focus:outline-none focus:ring-2 focus:ring-[#16803c]"
        >
          Save Entry
        </button>
      </div>
    </form>
  );
}
