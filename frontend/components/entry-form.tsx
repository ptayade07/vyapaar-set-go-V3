import { PhotoAttach } from "@/frontend/components/photo-attach";

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
  allowPhoto?: boolean;
};

export function EntryForm({
  title,
  subtitle,
  amountLabel = "Amount",
  options,
  action,
  showDueDate = false,
  allowPhoto = false,
}: Props) {
  return (
    <form action={action} className="tactile-card p-4">
      <div className="mb-4">
        <h2 className="text-xl font-black text-gray-900">{title}</h2>
        <p className="text-sm font-semibold text-gray-500">{subtitle}</p>
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
              className="tap-target block cursor-pointer rounded-xl border-2 border-gray-300 bg-white px-3 py-3 text-left font-black text-gray-900 transition-colors hover:border-orange-600 has-[:checked]:border-orange-600 has-[:checked]:bg-orange-600 has-[:checked]:text-white has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-orange-600"
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
        <label className="grid gap-2 text-sm font-bold text-gray-700">
          {amountLabel}
          <input
            name="amount"
            type="number"
            min="1"
            step="0.01"
            inputMode="decimal"
            placeholder="₹ amount"
            className="tap-target rounded-xl border border-gray-300 bg-white px-3 text-lg font-black focus:outline-none focus:ring-2 focus:ring-orange-600"
            required
          />
        </label>
        {showDueDate ? (
          <label className="grid gap-2 text-sm font-bold text-gray-700">
            Due date
            <input
              name="dueDate"
              type="date"
              className="tap-target rounded-xl border border-gray-300 bg-white px-3 text-base font-bold focus:outline-none focus:ring-2 focus:ring-orange-600"
            />
          </label>
        ) : null}
        <label className="grid gap-2 text-sm font-bold text-gray-700">
          Short note
          <textarea
            name="description"
            rows={2}
            placeholder="Example: atta, tel, biscuit"
            className="rounded-xl border border-gray-300 bg-white px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-orange-600"
          />
        </label>
        {allowPhoto ? <PhotoAttach /> : null}
        <button
          type="submit"
          className="tap-target rounded-xl bg-orange-600 px-5 py-3 text-lg font-black text-white shadow-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-700"
        >
          Save Entry
        </button>
      </div>
    </form>
  );
}
