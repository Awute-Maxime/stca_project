import { notification } from 'antd'
import { PrinterOutlined, CloseOutlined } from '@ant-design/icons'

interface OpParticuliere {
  dt: string
  user: string
  type: string
  vin: string
  immat: string
  tri: string | null
  dop: string
}

const OPS_PARTICULIERES: OpParticuliere[] = [
  { dt: '20/07/2020 08:14:32', user: 'aminou',  type: "RECYCLAGE Plaque N'Immat.", vin: 'JT164AEB103028887', immat: 'J0448', tri: '014067', dop: '20200720' },
  { dt: '20/07/2020 08:21:05', user: 'mathieu', type: "RECYCLAGE Plaque N'Immat.", vin: 'JA4MT31H0XP016533', immat: 'I9532', tri: '014051', dop: '20200720' },
  { dt: '20/07/2020 08:35:18', user: 'mathieu', type: "RECYCLAGE Plaque N'Immat.", vin: 'SB1KM28E20E010884', immat: 'I9474', tri: '014070', dop: '20200720' },
  { dt: '20/07/2020 09:02:44', user: 'aminou',  type: "RECYCLAGE Plaque N'Immat.", vin: '5NPDH4AE3FH646690', immat: 'C4243', tri: '014089', dop: '20200720' },
  { dt: '20/07/2020 09:18:57', user: 'aminou',  type: 'Impression DUPLICATA',      vin: 'W0L0TGF75X2292462', immat: 'D9020', tri: null,     dop: '20200720' },
  { dt: '20/07/2020 09:34:12', user: 'mathieu', type: "RECYCLAGE Plaque N'Immat.", vin: 'YS2RA4X2Z01108173', immat: 'A6840', tri: '014188', dop: '20200720' },
  { dt: '20/07/2020 10:07:29', user: 'aminou',  type: 'Modification enregistrement', vin: 'XLRAS47MS0E871771', immat: 'J0769', tri: '014161', dop: '20200720' },
]

export default function OpsParticulieresPage(): JSX.Element {
  const thStyle: React.CSSProperties = {
    padding: '5px 8px', textAlign: 'left', fontSize: 11.5,
    color: '#1E293B', fontWeight: 600, background: '#E8EEF4',
    borderBottom: '2px solid #CBD5E1', borderRight: '1px solid #CBD5E1',
  }

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        {/* Table */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: 170 }} />
              <col style={{ width: 130 }} />
              <col />
            </colgroup>
            <thead>
              <tr>
                <th style={thStyle}>Date</th>
                <th style={thStyle}>Utilisateur</th>
                <th style={{ ...thStyle, borderRight: 'none' }}>Description</th>
              </tr>
            </thead>
            <tbody>
              {OPS_PARTICULIERES.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ textAlign: 'center', padding: 40, color: '#94A3B8', fontStyle: 'italic' }}>
                    Aucune opération particulière enregistrée
                  </td>
                </tr>
              ) : (
                OPS_PARTICULIERES.map((op, i) => (
                  <tr key={i} style={{
                    background: i % 2 === 0 ? '#fff' : '#F8FAFF',
                    borderBottom: '1px solid #E2E8F0',
                    verticalAlign: 'top',
                  }}>
                    <td style={{ padding: '5px 8px', fontSize: 11, color: '#374151', borderRight: '1px solid #E2E8F0', whiteSpace: 'nowrap' }}>
                      {op.dt}
                    </td>
                    <td style={{ padding: '5px 8px', fontSize: 11, color: '#1E293B', borderRight: '1px solid #E2E8F0' }}>
                      {op.user}
                    </td>
                    <td style={{ padding: '5px 8px', fontSize: 11, lineHeight: 1.6 }}>
                      <span style={{ color: '#2563EB', fontWeight: 600 }}>{op.type} &gt;&gt;</span><br />
                      VIN = {op.vin}<br />
                      Date = {op.dop}<br />
                      N&apos;Immat. = {op.immat}
                      {op.tri && <><br />N&apos;Tri = {op.tri}</>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Status bar */}
        <div style={{
          padding: '4px 10px', background: '#FFFEF0', borderTop: '1px solid #E2E8F0',
          fontSize: 11, color: '#475569', flexShrink: 0,
        }}>
          Nbr d&apos;opérations : {OPS_PARTICULIERES.length}
        </div>
      </div>

      {/* Side panel */}
      <div style={{
        width: 130, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 5,
        padding: '7px 6px', background: '#F8FAFF', borderLeft: '1px solid #E2E8F0',
      }}>
        <button
          onClick={() => notification.info({ message: 'Impression liste opérations...', placement: 'bottomRight' })}
          style={{
            width: '100%', padding: '5px 6px', fontSize: 11, borderRadius: 4, cursor: 'pointer',
            border: '1px solid #BFDBFE', background: '#EFF6FF', color: '#1D4ED8', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
          }}
        >
          <PrinterOutlined /> Imprimer
        </button>
        <div style={{ flex: 1 }} />
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('mdi:close-self'))}
          style={{
            width: '100%', padding: '5px 6px', fontSize: 11, borderRadius: 4, cursor: 'pointer',
            border: '1px solid #FECACA', background: '#FFF5F5', color: '#DC2626', fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
          }}
        >
          <CloseOutlined /> Fermer
        </button>
      </div>
    </div>
  )
}
