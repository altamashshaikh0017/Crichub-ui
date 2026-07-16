/**
 * A photograph with its caption and photographer credit, as print would carry it.
 * Credits are sourced from public/images/CREDITS.json.
 *
 * `children` render inside `.figure__frame`, which wraps the image only — so an
 * overlay pinned to the frame stays put however the caption wraps beneath it.
 */
export default function Figure({
  src,
  alt,
  caption,
  credit,
  creditHref,
  className = '',
  width,
  height,
  eager = false,
  children,
}) {
  return (
    <figure className={`figure ${className}`}>
      <div className="figure__frame">
        <img
          className="figure__img"
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading={eager ? 'eager' : 'lazy'}
          fetchPriority={eager ? 'high' : 'auto'}
          decoding="async"
        />
        {children}
      </div>

      {(caption || credit) && (
        <figcaption>
          {caption && <em>{caption}</em>}
          {credit && (
            <span className="figure__credit">
              <a href={creditHref} target="_blank" rel="noreferrer noopener">
                {credit} / Unsplash
              </a>
            </span>
          )}
        </figcaption>
      )}
    </figure>
  )
}
