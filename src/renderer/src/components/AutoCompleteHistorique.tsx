import { useState, useMemo, useRef, useEffect, type CSSProperties, type KeyboardEvent } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// Autocomplétion générique pour les champs à mémoire du formulaire.
// `options` = la source des suggestions (historique de saisie ou référentiel).
// Filtrage insensible à la casse, préfixe tapé en gras, navigation ↑↓/Entrée/Échap,
// clic pour charger. Bouton (icône, effet verre) = ouvre la fenêtre de gestion.
// `transformSaisie` = mise en forme en direct (ex. MAJUSCULES) ; `normaliser` = à la sortie.
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  value: string
  onChange: (v: string) => void
  options: string[]
  disabled?: boolean
  style?: CSSProperties
  placeholder?: string
  icone?: string
  inputClass?: string
  maxLength?: number
  transformSaisie?: (v: string) => string
  normaliser?: (v: string) => string
  onOpenGestion?: () => void
}

const MAX_SUGGESTIONS = 8

export default function AutoCompleteHistorique({
  value, onChange, options, disabled, style, placeholder,
  icone = '📌', inputClass, maxLength, transformSaisie, normaliser, onOpenGestion,
}: Props): JSX.Element {
  const [open, setOpen] = useState(false)
  const [hi, setHi] = useState(0)
  const wrapRef = useRef<HTMLDivElement>(null)

  const filtre = value.trim().toUpperCase()
  const suggestions = useMemo(() => {
    if (!filtre) return []
    const uniques: string[] = []
    const vues = new Set<string>()
    for (const o of options) {
      const k = o.toUpperCase()
      if (k && !vues.has(k)) { vues.add(k); uniques.push(o) }
    }
    const debut = uniques.filter(o => o.toUpperCase().startsWith(filtre) && o.toUpperCase() !== filtre)
    const contient = uniques.filter(o => !o.toUpperCase().startsWith(filtre) && o.toUpperCase().includes(filtre))
    return [...debut, ...contient].slice(0, MAX_SUGGESTIONS)
  }, [options, filtre])

  useEffect(() => { setHi(0) }, [filtre])

  useEffect(() => {
    const h = (e: MouseEvent): void => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const choisir = (o: string): void => { onChange(o); setOpen(false) }

  const onKey = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (!open) { if (e.key === 'ArrowDown') setOpen(true); return }
    if (e.key === 'ArrowDown') { e.preventDefault(); setHi(i => Math.min(i + 1, suggestions.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHi(i => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter' && suggestions[hi]) { e.preventDefault(); choisir(suggestions[hi]) }
    else if (e.key === 'Escape') { setOpen(false) }
  }

  const flex = (style?.flex as number | string) ?? 1

  return (
    <div ref={wrapRef} style={{ display: 'flex', alignItems: 'center', gap: 6, flex }}>
      <div style={{ position: 'relative', flex: 1, display: 'flex' }}>
        <input
          className={inputClass ? `light-input ${inputClass}` : 'light-input'}
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          maxLength={maxLength}
          autoComplete="off"
          style={{ ...style, flex: 1, width: '100%' }}
          onChange={e => { onChange(transformSaisie ? transformSaisie(e.target.value) : e.target.value); setOpen(true) }}
          onBlur={() => { if (normaliser && value) onChange(normaliser(value)) }}
          onKeyDown={onKey}
        />

        {open && suggestions.length > 0 && !disabled && (
          <ul className="ac-hist">
            {suggestions.map((o, i) => {
              const match = o.toUpperCase().startsWith(filtre)
              return (
                <li
                  key={o}
                  onMouseDown={e => { e.preventDefault(); choisir(o) }}
                  onMouseEnter={() => setHi(i)}
                  className={i === hi ? 'actif' : undefined}
                >
                  <span className="ico">{icone}</span>
                  {match
                    ? <span><b>{o.slice(0, filtre.length)}</b>{o.slice(filtre.length)}</span>
                    : <span>{o}</span>}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {onOpenGestion && (
        <button
          type="button"
          className="btn-gestion"
          title="Gérer l'historique de ce champ (corriger, supprimer)"
          disabled={disabled}
          onMouseDown={e => e.preventDefault()}
          onClick={onOpenGestion}
        >
          <span className="ico" role="img">{icone}</span>
        </button>
      )}
    </div>
  )
}
