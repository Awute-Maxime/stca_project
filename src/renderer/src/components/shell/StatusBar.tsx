import { useEffect, useState } from 'react'
import { appColors } from '@theme/windev-theme'

interface StatusBarProps {
  nbVehiculesAujourdhui: number
}

function formatDate(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${dd}/${mm}/${d.getFullYear()}`
}

function formatHeure(d: Date): string {
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')
  return `${hh}:${mi}:${ss}`
}

export default function StatusBar({ nbVehiculesAujourdhui }: StatusBarProps): JSX.Element {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const dot = (color: string): JSX.Element => (
    <span style={{
      display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
      background: color, marginRight: 5, flexShrink: 0,
      boxShadow: `0 0 4px ${color}`,
    }} />
  )

  return (
    <div style={{
      height: 24,
      background: 'linear-gradient(90deg, #112654 0%, #1B3A6B 100%)',
      borderTop: '1px solid rgba(255,255,255,0.06)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 12px',
      fontSize: 10.5,
      color: 'rgba(255,255,255,0.85)',
      fontWeight: 500,
      gap: 0,
    }}>
      <span style={{
        display: 'flex', alignItems: 'center',
        paddingRight: 14, borderRight: '1px solid rgba(255,255,255,0.12)',
        letterSpacing: 0.3,
      }}>
        {dot('#4ADE80')}
        Mode Client/Serveur
      </span>
      <span style={{
        display: 'flex', alignItems: 'center',
        padding: '0 14px', borderRight: '1px solid rgba(255,255,255,0.12)',
        flex: 1,
      }}>
        {dot('#60A5FA')}
        {`${nbVehiculesAujourdhui} véhicule(s) enregistré(s) aujourd'hui`}
      </span>
      <span style={{
        display: 'flex', alignItems: 'center',
        paddingLeft: 14,
        fontFamily: "'Courier New', monospace",
        fontSize: 10,
        color: 'rgba(255,255,255,0.65)',
        letterSpacing: 0.5,
      }}>
        {dot('#F59E0B')}
        {`${formatDate(now)} · ${formatHeure(now)}`}
      </span>
    </div>
  )
}
