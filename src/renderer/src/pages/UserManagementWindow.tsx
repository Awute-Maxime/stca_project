import { useState } from 'react'
import { Table, Checkbox, Modal, Input, Switch, Button, Tag, Popconfirm, Tooltip, notification } from 'antd'
import {
  UserAddOutlined, DeleteOutlined,
  TeamOutlined, LockOutlined, CheckCircleOutlined, StopOutlined, EditOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useUtilisateurs, addUtilisateur, updateUtilisateur, removeUtilisateur, type Utilisateur } from '@mock/utilisateursStore'

// ── Palette ────────────────────────────────────────────────────────────────────
const C = {
  blue:   '#1B3A6B',
  accent: '#2563EB',
  gold:   '#F59E0B',
  green:  '#16A34A',
  red:    '#DC2626',
  muted:  '#6B7280',
  border: '#E2E8F0',
  bg:     '#F8FAFF',
}

// Sub-header beige (modèle Enregistrement — pas de 2e bandeau bleu sous la barre de titre)
function PageHeader(): JSX.Element {
  return (
    <div style={{
      background: '#F5F3EE', borderBottom: '2px solid #E2D9C8',
      padding: '10px 14px', marginBottom: 14, borderRadius: 6,
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <TeamOutlined style={{ color: '#1B3A6B', fontSize: 18 }} />
      <div>
        <div style={{ color: '#1B3A6B', fontSize: 11, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase' }}>Gestion des Utilisateurs</div>
        <div style={{ color: '#64748B', fontSize: 10, marginTop: 1 }}>
          Comptes d'accès à l'application TCIT
        </div>
      </div>
    </div>
  )
}

// ── Types locaux ───────────────────────────────────────────────────────────────
type UserRow = Utilisateur

interface AddModalState {
  login: string
  motDePasse: string
  nom: string
  administrateur: boolean
  compteActif: boolean
}

const EMPTY_FORM: AddModalState = {
  login: '', motDePasse: '', nom: '', administrateur: false, compteActif: true,
}

// ── Composant principal ────────────────────────────────────────────────────────
export default function UserManagementWindow(): JSX.Element {
  const rows = useUtilisateurs() // store partagé — persisté, utilisable au login, synchro toutes fenêtres
  const [addOpen, setAddOpen]     = useState(false)
  const [form, setForm]           = useState<AddModalState>(EMPTY_FORM)
  const [formErr, setFormErr]     = useState<string | null>(null)
  // Édition du mot de passe d'un utilisateur existant
  const [pwdEdit, setPwdEdit] = useState<{ id: number; login: string } | null>(null)
  const [pwdValue, setPwdValue] = useState('')

  // Affiche l'erreur de protection (dernier admin actif) le cas échéant
  const guard = (err: string | null): void => {
    if (err) notification.warning({ message: '🔒 Action refusée', description: err, placement: 'bottomRight' })
  }

  // ── Mutations — écrites en BASE (asynchrones) ───────────────────────────────
  const toggleAdmin = async (id: number, val: boolean): Promise<void> =>
    guard(await updateUtilisateur(id, { administrateur: val }))

  const toggleActif = async (id: number, val: boolean): Promise<void> =>
    guard(await updateUtilisateur(id, { compteActif: val }))

  const deleteUser = async (id: number): Promise<void> =>
    guard(await removeUtilisateur(id))

  const handleAdd = async (): Promise<void> => {
    if (!form.login.trim()) { setFormErr("Le nom d'utilisateur est requis"); return }
    if (rows.some(u => u.login.toLowerCase() === form.login.toLowerCase())) {
      setFormErr("Ce nom d'utilisateur existe déjà"); return
    }
    const err = await addUtilisateur({
      login: form.login.trim(),
      motDePasse: form.motDePasse,
      nom: form.nom.trim() || form.login.trim(),
      administrateur: form.administrateur,
      compteActif: form.compteActif,
    })
    if (err) { setFormErr(err); return }
    setAddOpen(false)
    setForm(EMPTY_FORM)
    setFormErr(null)
  }

  const handlePwdSave = async (): Promise<void> => {
    if (!pwdEdit) return
    const err = await updateUtilisateur(pwdEdit.id, { motDePasse: pwdValue })
    if (err) { guard(err); return }
    notification.success({ message: `🔑 Mot de passe de « ${pwdEdit.login} » modifié`, placement: 'bottomRight' })
    setPwdEdit(null)
    setPwdValue('')
  }

  // ── Colonnes ─────────────────────────────────────────────────────────────────
  const columns: ColumnsType<UserRow> = [
    {
      title: '#', dataIndex: 'id', width: 40, align: 'center' as const,
      render: v => <span style={{ fontSize: 11, color: C.muted }}>{v}</span>,
    },
    {
      title: 'Login utilisateur', dataIndex: 'login',
      render: (v, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
            background: row.administrateur ? `${C.accent}18` : `${C.muted}18`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700,
            color: row.administrateur ? C.accent : C.muted,
          }}>
            {v.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.blue }}>{v}</div>
            {row.nom && row.nom !== v && (
              <div style={{ fontSize: 10, color: C.muted }}>{row.nom}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'Mot de passe', dataIndex: 'motDePasseMasque', width: 160,
      render: (mask, row) => (
        // Mots de passe HACHÉS en base : ils ne sont jamais lisibles (sécurité).
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Tooltip title="Haché — non consultable">
            <span style={{ fontFamily: 'monospace', fontSize: 12, color: C.muted, letterSpacing: 2 }}>
              {mask || '••••••'}
            </span>
          </Tooltip>
          <Tooltip title="Modifier le mot de passe">
            <button
              onClick={() => { setPwdEdit({ id: row.id, login: row.login }); setPwdValue('') }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, fontSize: 12, padding: 0, display: 'flex' }}
            >
              <EditOutlined />
            </button>
          </Tooltip>
        </div>
      ),
    },
    {
      title: 'Administrateur', dataIndex: 'administrateur', width: 110, align: 'center' as const,
      render: (v, row) => (
        <Checkbox
          checked={v}
          onChange={e => void toggleAdmin(row.id, e.target.checked)}
          style={{ accentColor: C.accent }}
        />
      ),
    },
    {
      title: 'Compte actif', dataIndex: 'compteActif', width: 100, align: 'center' as const,
      render: (v, row) => (
        <Switch
          size="small"
          checked={v}
          onChange={val => void toggleActif(row.id, val)}
          checkedChildren={<CheckCircleOutlined />}
          unCheckedChildren={<StopOutlined />}
          style={{ background: v ? C.green : '#D1D5DB' }}
        />
      ),
    },
    {
      title: '', width: 44, align: 'center' as const,
      render: (_, row) => (
        <Popconfirm
          title="Supprimer cet utilisateur ?"
          description={`"${row.login}" sera supprimé définitivement.`}
          onConfirm={() => void deleteUser(row.id)}
          okText="Supprimer"
          cancelText="Annuler"
          okButtonProps={{ danger: true }}
        >
          <Tooltip title="Supprimer">
            <button style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#FECACA', fontSize: 15, padding: 2,
              display: 'flex', borderRadius: 4, transition: 'color 0.15s',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = C.red }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#FECACA' }}
            >
              <DeleteOutlined />
            </button>
          </Tooltip>
        </Popconfirm>
      ),
    },
  ]

  // ── Stats rapides ─────────────────────────────────────────────────────────────
  const nbAdmins  = rows.filter(u => u.administrateur).length
  const nbActifs  = rows.filter(u => u.compteActif).length

  return (
    <div style={{ padding: '12px 14px', height: '100%', overflow: 'auto', background: C.bg }}>
      <PageHeader />

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Tag style={{ background: `${C.accent}12`, color: C.accent, border: `1px solid ${C.accent}30`, fontSize: 10, fontWeight: 600 }}>
            {rows.length} utilisateurs
          </Tag>
          <Tag style={{ background: `${C.gold}12`, color: C.gold, border: `1px solid ${C.gold}30`, fontSize: 10, fontWeight: 600 }}>
            {nbAdmins} admins
          </Tag>
          <Tag style={{ background: `${C.green}12`, color: C.green, border: `1px solid ${C.green}30`, fontSize: 10, fontWeight: 600 }}>
            {nbActifs} actifs
          </Tag>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Button
            type="primary"
            icon={<UserAddOutlined />}
            size="small"
            style={{ background: C.accent, borderColor: C.accent, fontSize: 11, height: 28 }}
            onClick={() => { setForm(EMPTY_FORM); setFormErr(null); setAddOpen(true) }}
          >
            Nouvel utilisateur
          </Button>
        </div>
      </div>

      {/* Table */}
      <Table
        columns={columns}
        dataSource={rows}
        rowKey="id"
        size="small"
        pagination={{ pageSize: 12, size: 'small', showSizeChanger: false }}
        style={{ borderRadius: 6, overflow: 'hidden', border: `1px solid ${C.border}` }}
        rowClassName={(row) => row.compteActif ? '' : 'user-row-inactive'}
      />

      {/* Modal ajout */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.blue, fontSize: 13 }}>
            <UserAddOutlined />
            Nouvel utilisateur
          </div>
        }
        open={addOpen}
        onOk={() => void handleAdd()}
        onCancel={() => setAddOpen(false)}
        okText="Créer"
        cancelText="Annuler"
        okButtonProps={{ style: { background: C.accent, borderColor: C.accent } }}
        width={400}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 8 }}>
          {formErr && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 6, padding: '7px 10px', fontSize: 11, color: C.red }}>
              {formErr}
            </div>
          )}
          <div>
            <label style={{ fontSize: 11, color: C.muted, display: 'block', marginBottom: 4 }}>NOM D'UTILISATEUR *</label>
            <Input
              value={form.login}
              onChange={e => { setForm(f => ({ ...f, login: e.target.value })); setFormErr(null) }}
              placeholder="ex: jdupont"
              size="small"
            />
          </div>
          <div>
            <label style={{ fontSize: 11, color: C.muted, display: 'block', marginBottom: 4 }}>NOM COMPLET</label>
            <Input
              value={form.nom}
              onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
              placeholder="ex: Jean Dupont"
              size="small"
            />
          </div>
          <div>
            <label style={{ fontSize: 11, color: C.muted, display: 'block', marginBottom: 4 }}>MOT DE PASSE</label>
            <Input.Password
              value={form.motDePasse}
              onChange={e => setForm(f => ({ ...f, motDePasse: e.target.value }))}
              placeholder="Laisser vide pour aucun mot de passe"
              size="small"
            />
          </div>
          <div style={{ display: 'flex', gap: 24 }}>
            <Checkbox
              checked={form.administrateur}
              onChange={e => setForm(f => ({ ...f, administrateur: e.target.checked }))}
            >
              <span style={{ fontSize: 12 }}>Administrateur</span>
            </Checkbox>
            <Checkbox
              checked={form.compteActif}
              onChange={e => setForm(f => ({ ...f, compteActif: e.target.checked }))}
            >
              <span style={{ fontSize: 12 }}>Compte actif</span>
            </Checkbox>
          </div>
        </div>
      </Modal>

      {/* Modal modification mot de passe */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: C.blue, fontSize: 13 }}>
            <LockOutlined />
            Mot de passe de « {pwdEdit?.login} »
          </div>
        }
        open={pwdEdit !== null}
        onOk={() => void handlePwdSave()}
        onCancel={() => { setPwdEdit(null); setPwdValue('') }}
        okText="Enregistrer"
        cancelText="Annuler"
        okButtonProps={{ style: { background: C.accent, borderColor: C.accent } }}
        width={360}
      >
        <div style={{ paddingTop: 8 }}>
          <label style={{ fontSize: 11, color: C.muted, display: 'block', marginBottom: 4 }}>NOUVEAU MOT DE PASSE</label>
          <Input.Password
            value={pwdValue}
            onChange={e => setPwdValue(e.target.value)}
            onPressEnter={() => void handlePwdSave()}
            placeholder="Laisser vide = aucun mot de passe"
            size="small"
            autoFocus
          />
        </div>
      </Modal>

      <style>{`
        .user-row-inactive td { opacity: 0.45; }
        .user-row-inactive:hover td { opacity: 0.65; }
      `}</style>
    </div>
  )
}
