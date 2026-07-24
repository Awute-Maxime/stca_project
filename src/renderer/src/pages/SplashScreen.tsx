import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { electronApi } from '@api/electron'
import carLowPoly from '../assets/car-lowpoly.png'

// ─────────────────────────────────────────────────────────────────────────────
// IMAGE FLASH TCIT — format compact 500×320, en harmonie avec la fenêtre de
// connexion (440×360) vers laquelle elle se réduit ensuite (validé 24/07/2026).
// Composition : voiture low-poly (image, recadrée + fondue dans la scène),
// radar de balayage, ligne de scan, réseau tech isométrique à droite, traces de
// circuit en bas, titre TCIT en grand (proportions inspirées de STCA II) et —
// idée de l'utilisateur — LE DRAPEAU TOGOLAIS EST LA BARRE DE PROGRESSION :
// il se complète de gauche à droite pendant le chargement, puis le reflet passe.
// ─────────────────────────────────────────────────────────────────────────────

const SPLASH_DURATION = 2200

type DragCSS = React.CSSProperties & { WebkitAppRegion?: 'drag' | 'no-drag' }

// Réglages de la voiture — proportions adaptées au format compact 500×320
const CAR = {
  largeur: 300,          // largeur affichée de la zone recadrée
  top: 24,
  cropX: 175, cropY: 100, cropW: 430, cropH: 255, // zone utile de l'image source
  srcW: 612,             // largeur réelle de l'image
  eclat: 14, contraste: 115,
  opacite: 0.70,         // transparente → se fond dans la scène et laisse voir le bureau
}
const S = CAR.largeur / CAR.cropW // facteur d'échelle

// Masque de fondu des bords (fondu = 72 dans le prototype)
const MASQUE =
  'radial-gradient(ellipse 62% 64% at 50% 52%, #000 22%, rgba(0,0,0,.78) 37%, ' +
  'rgba(0,0,0,.42) 54%, rgba(0,0,0,.16) 69%, transparent 100%)'

export default function SplashScreen(): JSX.Element {
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => {
      electronApi.resizeForLogin()
      navigate('/login', { replace: true })
    }, SPLASH_DURATION)
    return () => clearTimeout(timer)
  }, [navigate])

  const outer: DragCSS = {
    width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden',
    // Fond TRANSLUCIDE → on aperçoit le bureau au travers (effet verre)
    background: 'radial-gradient(ellipse at 32% 40%, rgba(14,42,82,.80) 0%, rgba(7,22,52,.84) 48%, rgba(3,10,24,.87) 100%)',
    userSelect: 'none', WebkitAppRegion: 'drag',
    animation: 'splashFadeIn 0.45s ease-out both',
  }

  return (
    <div style={outer}>
      {/* Grille de fond */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'radial-gradient(circle, rgba(0,212,255,.05) 1px, transparent 1px)',
        backgroundSize: '30px 30px',
      }} />

      {/* Réseau tech isométrique — à droite */}
      <svg viewBox="0 0 340 340" fill="none" style={{
        position: 'absolute', top: 0, right: 0, width: '48%', height: '100%',
        opacity: 0.38, pointerEvents: 'none',
      }}>
        <g stroke="#38BDF8" strokeWidth=".9" opacity=".75">
          <path d="M96,116 L122,103 L148,116 L122,129 Z" opacity=".5" />
          <path d="M164,80 L190,67 L216,80 L190,93 Z" opacity=".42" />
          <path d="M200,156 L224,144 L248,156 L224,168 Z" opacity=".38" />
          <path d="M118,192 L140,181 L162,192 L140,203 Z" opacity=".32" />
          <path d="M250,110 L270,100 L290,110 L270,120 Z" opacity=".3" />
          <rect x="116" y="111" width="12" height="9" rx="1.5" opacity=".55" />
          <circle cx="190" cy="79" r="4.5" opacity=".55" />
          <path d="M218,153 h11 M218,157 h7" opacity=".5" />
          <path d="M135,189 l5,-5 l5,5" opacity=".5" />
        </g>
        <g stroke="#00D4FF" strokeWidth="1" strokeDasharray="2 6" opacity=".5">
          <path d="M122,129 L140,181" /><path d="M190,93 L224,144" />
          <path d="M148,116 L200,156" /><path d="M216,80 L270,100" />
        </g>
        <g>
          <circle className="sp-pulse" cx="122" cy="103" r="3" fill="#00D4FF" />
          <circle className="sp-pulse" cx="190" cy="67" r="3" fill="#7CF7C6" style={{ animationDelay: '.8s' }} />
          <circle className="sp-pulse" cx="248" cy="156" r="3" fill="#FF6BA8" style={{ animationDelay: '1.6s' }} />
          <circle className="sp-pulse" cx="140" cy="203" r="2.5" fill="#FFDF6B" style={{ animationDelay: '2.4s' }} />
          <circle className="sp-pulse" cx="290" cy="110" r="2.5" fill="#38BDF8" style={{ animationDelay: '1.2s' }} />
        </g>
      </svg>

      {/* Traces de circuit imprimé — en bas */}
      <svg viewBox="0 0 720 130" fill="none" preserveAspectRatio="none" style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, height: '42%',
        opacity: 0.34, pointerEvents: 'none',
      }}>
        <g stroke="#00D4FF" strokeWidth="1" opacity=".55">
          <path d="M0,40 H120 L140,60 H300" /><path d="M720,30 H600 L580,52 H430" />
          <path d="M0,86 H90 L112,66 H250" /><path d="M720,96 H560 L540,76 H400" />
          <path d="M60,40 V12" /><path d="M300,60 V96" /><path d="M580,52 V20" /><path d="M540,76 V104" />
        </g>
        <g fill="#00D4FF" opacity=".7">
          <circle cx="120" cy="40" r="2.5" /><circle cx="300" cy="60" r="2.5" /><circle cx="600" cy="30" r="2.5" />
          <circle cx="90" cy="86" r="2.5" /><circle cx="560" cy="96" r="2.5" /><circle cx="430" cy="52" r="2.5" />
        </g>
      </svg>

      {/* Radar de balayage */}
      <div style={{
        position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)',
        width: 205, height: 205, borderRadius: '50%', opacity: 0.4, pointerEvents: 'none',
        background: 'conic-gradient(from 0deg, rgba(0,212,255,.22), transparent 26%)',
        animation: 'splashSpin 3.4s linear infinite',
      }} />

      {/* LA VOITURE — image recadrée, fondue dans la scène */}
      <div style={{
        position: 'absolute', top: CAR.top, left: '50%', transform: 'translateX(-50%)',
        mixBlendMode: 'screen', pointerEvents: 'none',
        animation: 'splashCarIn 0.9s cubic-bezier(0.16,1,0.3,1) 0.1s both',
      }}>
        <div style={{
          position: 'relative', overflow: 'hidden',
          width: CAR.largeur, height: Math.round(CAR.cropH * S),
          WebkitMaskImage: MASQUE, maskImage: MASQUE,
        }}>
          <img
            src={carLowPoly}
            alt=""
            style={{
              position: 'absolute', display: 'block', maxWidth: 'none',
              width: Math.round(CAR.srcW * S),
              left: -Math.round(CAR.cropX * S),
              top: -Math.round(CAR.cropY * S),
              opacity: CAR.opacite,
              filter: `drop-shadow(0 0 ${CAR.eclat}px rgba(0,170,255,.75)) contrast(${CAR.contraste}%)`,
            }}
          />
        </div>
      </div>

      {/* Ligne de scan */}
      <div style={{
        position: 'absolute', left: '50%', transform: 'translateX(-50%)', width: 268, height: 2,
        background: 'linear-gradient(90deg,transparent,#8ff4ff,transparent)',
        boxShadow: '0 0 12px #00D4FF', pointerEvents: 'none',
        animation: 'splashScan 2.4s ease-in-out infinite',
      }} />

      {/* Titre TCIT — grand format */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 30, textAlign: 'center' }}>
        <div style={{
          fontSize: 54, fontWeight: 800, letterSpacing: 13, color: '#F7FBFF', lineHeight: 1,
          fontFamily: "'Segoe UI', Arial, sans-serif",
          textShadow: '0 0 38px rgba(0,180,255,.55), 0 3px 12px rgba(0,0,0,.5)',
          animation: 'splashTextIn 0.7s cubic-bezier(0.16,1,0.3,1) 0.25s both',
        }}>
          <svg width="26" height="26" viewBox="0 0 56 56" style={{
            filter: 'drop-shadow(0 0 8px rgba(255,223,0,.9))', verticalAlign: 'middle', marginRight: 13,
          }}>
            <polygon points="28,2 33.8,18.4 51.8,18.4 37.4,28.4 43.2,44.8 28,34.8 12.8,44.8 18.6,28.4 4.2,18.4 22.2,18.4" fill="#FFDF00" />
          </svg>
          TCIT
        </div>
        <div style={{
          width: 230, height: 1, margin: '11px auto 8px',
          background: 'linear-gradient(90deg,transparent,#00D4FF 30%,#38BDF8 70%,transparent)',
          animation: 'splashTextIn 0.7s cubic-bezier(0.16,1,0.3,1) 0.35s both',
        }} />
        <div style={{
          fontSize: 8.5, letterSpacing: 1.6, textTransform: 'uppercase',
          color: 'rgba(56,189,248,.75)', fontFamily: "'Segoe UI', Arial, sans-serif",
          animation: 'splashTextIn 0.7s cubic-bezier(0.16,1,0.3,1) 0.45s both',
        }}>
          Togolaise de Contrôle et d&apos;Immatriculation Transit
        </div>
      </div>

      {/* Ligne d'état technique */}
      <div style={{
        position: 'absolute', bottom: 13, left: '50%', transform: 'translateX(-50%)',
        fontFamily: 'Consolas, monospace', fontSize: 7, letterSpacing: 1,
        color: 'rgba(56,189,248,.38)', whiteSpace: 'nowrap',
        // keyframe dédiée : elle conserve le translateX(-50%) du centrage
        animation: 'splashDataIn 0.6s ease 0.6s both',
      }}>
        TG-WZ · SCAN OK · VIN ✓ · IMMAT ✓ · TRANSIT ✓
      </div>

      {/* ── LE DRAPEAU TOGOLAIS EST LA BARRE DE PROGRESSION (fin, 2 px) ── */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 2,
        background: 'rgba(255,255,255,.07)',
      }}>
        <div className="sp-flagfill" style={{
          position: 'absolute', inset: 0, overflow: 'hidden',
          background: 'linear-gradient(90deg, rgba(0,106,78,0) 0%, #006A4E 16%, #006A4E 34%, #FFDF00 50%, #D21034 66%, #D21034 84%, rgba(210,16,52,0) 100%)',
          animation: `splashFlagFill ${SPLASH_DURATION}ms cubic-bezier(.4,.05,.25,1) forwards`,
        }} />
      </div>

      <style>{`
        @keyframes splashFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes splashSpin   { to { transform: translateX(-50%) rotate(360deg); } }
        @keyframes splashCarIn  {
          from { opacity: 0; transform: translateX(-50%) translateX(-16px) scale(.97); }
          to   { opacity: 1; transform: translateX(-50%) translateX(0) scale(1); }
        }
        @keyframes splashTextIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        /* Variante centrée : conserve le translateX(-50%) (sinon l'animation l'écrase) */
        @keyframes splashDataIn {
          from { opacity: 0; transform: translateX(-50%) translateY(8px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes splashScan   { 0%,100% { top: 34px; opacity: .12; } 50% { top: 172px; opacity: .9; } }
        @keyframes splashFlagFill { from { clip-path: inset(0 100% 0 0); } to { clip-path: inset(0 0 0 0); } }
        .sp-pulse { animation: splashPulse 4s ease-in-out infinite; }
        @keyframes splashPulse { 0%,100% { opacity: .3; } 50% { opacity: 1; } }
        /* le reflet ne passe qu'une fois le drapeau complet */
        .sp-flagfill::after {
          content: ''; position: absolute; top: 0; bottom: 0; left: -30%; width: 30%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,.8), transparent);
          animation: splashFlagShine 900ms ease-in-out ${SPLASH_DURATION - 200}ms both;
        }
        @keyframes splashFlagShine {
          from { transform: translateX(0); opacity: 0; }
          20%  { opacity: 1; }
          to   { transform: translateX(433%); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
