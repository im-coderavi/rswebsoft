import Button from "./Button"

export default function PageHeader({ title, description, action }) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="font-display text-xl font-bold text-cloud-100">{title}</h1>
        {description && <p className="mt-1 text-sm text-cloud-400">{description}</p>}
      </div>
      {action && (
        <Button variant="primary" icon={action.icon} onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}
