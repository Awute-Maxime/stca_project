import { useEffect, useState } from 'react'
import { winDevColors } from '@theme/windev-theme'

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

  return (
    <div style={{
      height: 24,
      background: winDevColors.statusBarBg,
      borderTop: '1px solid #C0BCA8',
      display: 'flex',
      alignItems: 'center',
      padding: '0 10px',
      fontSize: 11,
      color: winDevColors.statusBarText,
      fontWeight: 600
    }}>
      <span style={{ paddingRight: 16, borderRight: '1px solid #C0BCA8' }}>
        Fonctionnement en Mode Client/Serveur
      </span>
      <span style={{ padding: '0 16px', borderRight: '1px solid #C0BCA8', flex: 1 }}>
        {`Nbr de véhicule(s) enregistré(s) aujourd'hui : ${nbVehiculesAujourdhui}`}
      </span>
      <span style={{ paddingLeft: 16, fontFamily: 'monospace' }}>
        {`${formatDate(now)} — ${formatHeure(now)}`}
      </span>
    </div>
  )
}
