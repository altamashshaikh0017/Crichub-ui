/**
 * A single labelled form control for the auth screens.
 * Pass `options` to render a <select>, otherwise it renders an <input>.
 * `error` is the per-field validation message from ApiError.fieldErrors.
 */
export default function Field({
  label,
  name,
  error,
  hint,
  options,
  optional = false,
  children,
  ...props
}) {
  const id = `f-${name}`
  const describedBy = error ? `${id}-err` : hint ? `${id}-hint` : undefined

  return (
    <div className={`field ${error ? 'field--invalid' : ''}`}>
      <label htmlFor={id} className="field__label">
        {label}
        {optional && <span className="field__optional">Optional</span>}
      </label>

      {options ? (
        <select
          id={id}
          name={name}
          className="field__control field__control--select"
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <div className="field__control-wrap">
          <input
            id={id}
            name={name}
            className={`field__control ${children ? 'field__control--affix' : ''}`}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={describedBy}
            {...props}
          />
          {children}
        </div>
      )}

      {error ? (
        <p id={`${id}-err`} className="field__error" role="alert">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="field__hint">
            {hint}
          </p>
        )
      )}
    </div>
  )
}
