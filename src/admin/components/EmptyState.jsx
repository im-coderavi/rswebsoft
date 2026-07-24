export default function EmptyState({ icon: IconComp, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-4 py-14 text-center">
      {IconComp && (
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-ink-800 text-cloud-500">
          <IconComp size={22} />
        </span>
      )}
      <div>
        <p className="text-sm font-semibold text-cloud-200">{title}</p>
        {description && <p className="mt-1 text-xs text-cloud-500">{description}</p>}
      </div>
      {action}
    </div>
  )
}
