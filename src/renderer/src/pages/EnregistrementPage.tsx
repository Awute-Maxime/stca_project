import { useState, useEffect } from 'react'
import {
  Form, Input, Select, DatePicker, Button, Card, Row, Col,
  Divider, InputNumber, Radio, Checkbox, Tag, Space, Typography, Modal, message
} from 'antd'
import {
  CarOutlined, UserOutlined, FileTextOutlined,
  CheckOutlined, CloseOutlined, ReloadOutlined, SearchOutlined
} from '@ant-design/icons'
import { motion } from 'framer-motion'
import dayjs from 'dayjs'
import { mockDestinations } from '@mock/destinations'

const { Title, Text } = Typography
const { Option } = Select

const DESTINATIONS = mockDestinations.map(d => ({ code: d.code, nom: d.nom, lettre: d.lettre }))
const TYPES_VEHICULE = ['Voiture', 'Camion', 'Moto', 'Bus', 'Pick-up', 'Minibus']
const MONTANT_FIXE = 10000
const BLUE = '#1B3A6B'
const ACCENT = '#2563EB'

// ─── Composant principal ──────────────────────────────────────────────────────

export default function EnregistrementPage(): JSX.Element {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [immatGenere, setImmatGenere] = useState<string | null>(null)
  const [typeVehiculeOk, setTypeVehiculeOk] = useState(false)
  const [marqueModalOpen, setMarqueModalOpen] = useState(false)
  const [parcModalOpen, setParcModalOpen] = useState(false)

  // Génère le N° IMMAT en fonction de la destination sélectionnée
  const handleDestinationChange = (code: string): void => {
    if (!typeVehiculeOk) {
      message.warning('Veuillez d\'abord sélectionner le type de véhicule')
      form.setFieldValue('destination', undefined)
      return
    }
    const dest = DESTINATIONS.find((d) => d.code === code)
    if (dest) {
      // TODO: appel API pour obtenir le prochain N° depuis le serveur
      const mockNumero = String(Math.floor(Math.random() * 9000) + 1000).padStart(4, '0')
      const immat = `${dest.lettre}${mockNumero}`
      setImmatGenere(immat)
      form.setFieldValue('montant', MONTANT_FIXE)
    }
  }

  const handleTypeVehiculeChange = (): void => {
    setTypeVehiculeOk(true)
    // Reset destination et immat si on change de type
    form.setFieldValue('destination', undefined)
    form.setFieldValue('montant', undefined)
    setImmatGenere(null)
  }

  const onFinish = async (values: Record<string, unknown>): Promise<void> => {
    setLoading(true)
    try {
      console.log('Données enregistrement:', { ...values, immat: immatGenere })
      // TODO: POST /api/vehicules
      await new Promise((r) => setTimeout(r, 1000))
      message.success(`Véhicule enregistré — N° IMMAT: ${immatGenere}`)
      onReset()
    } catch {
      message.error('Erreur lors de l\'enregistrement')
    } finally {
      setLoading(false)
    }
  }

  const onReset = (): void => {
    form.resetFields()
    setImmatGenere(null)
    setTypeVehiculeOk(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* En-tête page */}
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={4} style={{ margin: 0, color: '#1B3A6B' }}>
            <CarOutlined style={{ marginRight: 8 }} />
            Enregistrement d'un véhicule
          </Title>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Formulaire d'enregistrement transit — TCIT
          </Text>
        </div>

        {/* N° IMMAT généré */}
        {immatGenere && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{
              background: '#1B3A6B',
              borderRadius: 10,
              padding: '10px 24px',
              textAlign: 'center'
            }}
          >
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>N° IMMATRICULATION</div>
            <div style={{ color: '#FFDF00', fontSize: 26, fontWeight: 900, letterSpacing: 3 }}>
              {immatGenere}
            </div>
          </motion.div>
        )}
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ date: dayjs(), recyclerPlaque: 'non', montant: undefined }}
        size="middle"
      >
        <Row gutter={[16, 0]}>

          {/* ── Colonne gauche ─────────────────────────────────────── */}
          <Col xs={24} lg={12}>

            {/* Section En-tête */}
            <Card
              size="small"
              title={<><FileTextOutlined style={{ color: '#1B3A6B', marginRight: 6 }} />Référence</>}
              style={{ borderRadius: 8, marginBottom: 12 }}
            >
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item label="Référence" style={{ marginBottom: 8 }}>
                    <Input disabled placeholder="Auto-généré" style={{ background: '#f5f5f5' }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="date" label="En date du" style={{ marginBottom: 8 }}>
                    <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="parcId"
                label="Parc / Zone d'importation"
                style={{ marginBottom: 0 }}
                rules={[{ required: true, message: 'Sélectionner le parc' }]}
              >
                <Input
                  readOnly
                  placeholder="Cliquer pour sélectionner..."
                  onClick={() => setParcModalOpen(true)}
                  suffix={<SearchOutlined style={{ color: '#1B3A6B', cursor: 'pointer' }} />}
                  style={{ cursor: 'pointer' }}
                />
              </Form.Item>
            </Card>

            {/* Section Acheteur */}
            <Card
              size="small"
              title={<><UserOutlined style={{ color: '#1B3A6B', marginRight: 6 }} />Coordonnées acheteur</>}
              style={{ borderRadius: 8, marginBottom: 12 }}
            >
              <Form.Item
                name="nomPrenom"
                label="Nom et prénom"
                rules={[{ required: true, message: 'Nom requis' }]}
                style={{ marginBottom: 10 }}
              >
                <Input placeholder="Nom et prénom de l'acheteur" />
              </Form.Item>

              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item name="paysResidence" label="Pays de résidence" style={{ marginBottom: 10 }}>
                    <Input placeholder="Pays résidence" style={{ background: '#fffbe6' }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="paysDestination" label="Pays de destination" style={{ marginBottom: 10 }}>
                    <Input placeholder="Pays destination" style={{ background: '#fffbe6' }} />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="maisonTransitId" label="Maison de transit" style={{ marginBottom: 0 }}>
                <Input
                  readOnly
                  placeholder="Cliquer pour sélectionner..."
                  suffix={<SearchOutlined style={{ color: '#999', cursor: 'pointer' }} />}
                  style={{ cursor: 'pointer' }}
                />
              </Form.Item>
            </Card>
          </Col>

          {/* ── Colonne droite ─────────────────────────────────────── */}
          <Col xs={24} lg={12}>

            {/* Section Véhicule */}
            <Card
              size="small"
              title={<><CarOutlined style={{ color: '#1B3A6B', marginRight: 6 }} />Description du véhicule</>}
              style={{ borderRadius: 8, marginBottom: 12 }}
            >
              {/* Type véhicule — DOIT être rempli en premier */}
              <Form.Item
                name="typeVehicule"
                label={
                  <span>
                    Véhicule à assurer{' '}
                    <Tag color="red" style={{ fontSize: 10, marginLeft: 4 }}>Remplir en premier</Tag>
                  </span>
                }
                rules={[{ required: true, message: 'Type de véhicule requis' }]}
                style={{ marginBottom: 10 }}
              >
                <Select placeholder="Sélectionner le type..." onChange={handleTypeVehiculeChange}>
                  {TYPES_VEHICULE.map((t) => (
                    <Option key={t} value={t}>{t}</Option>
                  ))}
                </Select>
              </Form.Item>

              {/* Destination */}
              <Form.Item
                name="destination"
                label="À destination de"
                rules={[{ required: true, message: 'Destination requise' }]}
                style={{ marginBottom: 10 }}
              >
                <Select
                  placeholder={typeVehiculeOk ? 'Sélectionner la destination...' : '⚠️ Sélectionner d\'abord le type de véhicule'}
                  onChange={handleDestinationChange}
                  disabled={!typeVehiculeOk}
                >
                  {DESTINATIONS.map((d) => (
                    <Option key={d.code} value={d.code}>
                      <Space>
                        <Tag color="green" style={{ fontWeight: 700, minWidth: 36, textAlign: 'center' }}>{d.code}</Tag>
                        {d.nom}
                      </Space>
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              {/* Montant */}
              <Form.Item name="montant" label="Montant (FCFA)" style={{ marginBottom: 10 }}>
                <InputNumber
                  disabled
                  style={{ width: '100%', background: '#f6ffed', fontWeight: 700 }}
                  formatter={(v) => v ? `${Number(v).toLocaleString('fr-FR')} FCFA` : ''}
                />
              </Form.Item>

              {/* Marque / Modèle */}
              <Form.Item
                name="marqueModele"
                label="Marque - Modèle"
                rules={[{ required: true, message: 'Marque/Modèle requis' }]}
                style={{ marginBottom: 10 }}
              >
                <Input
                  readOnly
                  placeholder="Cliquer pour sélectionner..."
                  onClick={() => setMarqueModalOpen(true)}
                  suffix={<SearchOutlined style={{ color: '#1B3A6B', cursor: 'pointer' }} />}
                  style={{ cursor: 'pointer' }}
                />
              </Form.Item>

              {/* N° Chassis */}
              <Form.Item name="numeroChassis" label="N° de Chassis (VIN)" style={{ marginBottom: 10 }}>
                <Input
                  placeholder="Ex: ZFA29000000302873"
                  style={{ fontFamily: 'monospace', letterSpacing: 1 }}
                  maxLength={17}
                />
              </Form.Item>

              {/* Recycler plaque */}
              <Form.Item name="recyclerPlaque" label="Recycler plaque perdue" style={{ marginBottom: 10 }}>
                <Radio.Group>
                  <Radio value="oui">Oui</Radio>
                  <Radio value="non">Non</Radio>
                </Radio.Group>
              </Form.Item>

              {/* Imprimer résumé */}
              <Form.Item name="imprimerResume" valuePropName="checked" style={{ marginBottom: 0 }}>
                <Checkbox>Imprimer résumé fiche profil</Checkbox>
              </Form.Item>
            </Card>
          </Col>
        </Row>

        {/* ── Boutons d'action ───────────────────────────────────────── */}
        <Card style={{ borderRadius: 8, background: '#fafafa' }} bodyStyle={{ padding: '12px 16px' }}>
          <Row justify="end" gutter={12}>
            <Col>
              <Button
                icon={<ReloadOutlined />}
                onClick={onReset}
                size="large"
                style={{ borderColor: '#1B3A6B', color: '#1B3A6B' }}
              >
                Réinitialiser
              </Button>
            </Col>
            <Col>
              <Button
                icon={<CloseOutlined />}
                size="large"
                danger
                onClick={onReset}
              >
                Annuler
              </Button>
            </Col>
            <Col>
              <Button
                type="primary"
                htmlType="submit"
                icon={<CheckOutlined />}
                loading={loading}
                size="large"
                style={{ background: '#1B3A6B', borderColor: '#1B3A6B', fontWeight: 600, minWidth: 160 }}
              >
                Enregistrer
              </Button>
            </Col>
          </Row>
        </Card>
      </Form>

      {/* ── Modal sélection Marque/Modèle ─────────────────────────── */}
      <MarqueModeleModal
        open={marqueModalOpen}
        onSelect={(val) => {
          form.setFieldValue('marqueModele', val)
          setMarqueModalOpen(false)
        }}
        onCancel={() => setMarqueModalOpen(false)}
      />

      {/* ── Modal sélection Parc ───────────────────────────────────── */}
      <ParcModal
        open={parcModalOpen}
        onSelect={(val) => {
          form.setFieldValue('parcId', val)
          setParcModalOpen(false)
        }}
        onCancel={() => setParcModalOpen(false)}
      />
    </motion.div>
  )
}

// ─── Modal Marque / Modèle ────────────────────────────────────────────────────

function MarqueModeleModal({
  open, onSelect, onCancel
}: { open: boolean; onSelect: (val: string) => void; onCancel: () => void }): JSX.Element {
  const [search, setSearch] = useState('')
  const [items] = useState<string[]>([
    'ACERBI 125 PS', 'DAF XF 105', 'FIAT DUCATO', 'HONDA ACCORD',
    'MERCEDES ACTROS', 'OPEL ASTRA', 'PEUGEOT 406', 'TOYOTA HILUX',
    'VOLKSWAGEN GOLF', 'RENAULT MASTER'
    // TODO: charger depuis API /api/referentiel/marques
  ])

  const filtered = items.filter((i) => i.toLowerCase().includes(search.toLowerCase()))

  return (
    <Modal
      title="Sélectionner Marque / Modèle"
      open={open}
      onCancel={onCancel}
      footer={null}
      width={480}
    >
      <Input
        placeholder="Rechercher..."
        prefix={<SearchOutlined />}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: 12 }}
        autoFocus
      />
      <div style={{ maxHeight: 360, overflowY: 'auto' }}>
        {filtered.map((item) => (
          <div
            key={item}
            onClick={() => onSelect(item)}
            style={{
              padding: '8px 12px',
              cursor: 'pointer',
              borderRadius: 4,
              transition: 'background 0.15s'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#eff6ff')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            {item}
          </div>
        ))}
      </div>
    </Modal>
  )
}

// ─── Modal Parc / Zone d'importation ─────────────────────────────────────────

function ParcModal({
  open, onSelect, onCancel
}: { open: boolean; onSelect: (val: string) => void; onCancel: () => void }): JSX.Element {
  const [search, setSearch] = useState('')
  const [items] = useState<string[]>([
    'Parc Lomé Centre', 'Parc Adakpamé', 'Parc Agoé', 'Parc Baguida',
    'Parc Hédzranawoé', 'Parc Agbalépedogan', 'Parc Port Autonome de Lomé'
    // TODO: charger depuis API /api/referentiel/zones
  ])

  const filtered = items.filter((i) => i.toLowerCase().includes(search.toLowerCase()))

  return (
    <Modal
      title="Sélectionner le Parc / Zone d'importation"
      open={open}
      onCancel={onCancel}
      footer={null}
      width={460}
    >
      <Input
        placeholder="Rechercher..."
        prefix={<SearchOutlined />}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: 12 }}
        autoFocus
      />
      <div style={{ maxHeight: 320, overflowY: 'auto' }}>
        {filtered.map((item) => (
          <div
            key={item}
            onClick={() => onSelect(item)}
            style={{ padding: '8px 12px', cursor: 'pointer', borderRadius: 4 }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#eff6ff')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            {item}
          </div>
        ))}
      </div>
    </Modal>
  )
}
