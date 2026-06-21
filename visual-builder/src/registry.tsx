import React from 'react'
import {
  Button,
  Alert,
  Avatar,
  Breadcrumb,
  Card,
  Checkbox,
  Progress,
  Separator,
  Slider,
  StatusBadge,
  Switch,
  Tag,
  Textarea,
  TextInput,
  Accordion,
  ButtonGroup,
  Tabs,
} from '@harnessio/ui/components'

export interface PropDef {
  key: string
  label: string
  type: 'string' | 'boolean' | 'number' | 'select' | 'range'
  defaultValue: unknown
  options?: Array<{ label: string; value: string }>
  min?: number
  max?: number
  step?: number
}

export interface ComponentEntry {
  id: string
  name: string
  category: string
  description: string
  props: PropDef[]
  render: (props: Record<string, unknown>) => React.ReactElement
  code: (props: Record<string, unknown>) => string
}

const s = (v: unknown) => (v === true ? '' : v === false ? '' : ` ${JSON.stringify(v)}`)

export const REGISTRY: ComponentEntry[] = [
  // ── ACTIONS ──────────────────────────────────────────────────────
  {
    id: 'button',
    name: 'Button',
    category: 'Actions',
    description: 'Primary interactive element with variants',
    props: [
      { key: 'children', label: 'Label', type: 'string', defaultValue: 'Click me' },
      {
        key: 'variant', label: 'Variant', type: 'select', defaultValue: 'default',
        options: [
          { label: 'Default', value: 'default' },
          { label: 'Secondary', value: 'secondary' },
          { label: 'Outline', value: 'outline' },
          { label: 'Ghost', value: 'ghost' },
          { label: 'Link', value: 'link' },
          { label: 'Primary', value: 'primary' },
          { label: 'AI', value: 'ai' },
        ],
      },
      {
        key: 'size', label: 'Size', type: 'select', defaultValue: 'md',
        options: [
          { label: 'XS', value: 'xs' }, { label: 'Small', value: 'sm' }, { label: 'Medium', value: 'md' },
        ],
      },
      { key: 'disabled', label: 'Disabled', type: 'boolean', defaultValue: false },
    ],
    render: (p) => (
      <Button variant={p.variant as any} size={p.size as any} disabled={!!p.disabled}>
        {p.children as string}
      </Button>
    ),
    code: (p) => `<Button variant="${p.variant}" size="${p.size}"${p.disabled ? ' disabled' : ''}>\n  ${p.children}\n</Button>`,
  },
  {
    id: 'button-group',
    name: 'Button Group',
    category: 'Actions',
    description: 'Grouped related buttons',
    props: [
      { key: 'label1', label: 'Button 1', type: 'string', defaultValue: 'Copy' },
      { key: 'label2', label: 'Button 2', type: 'string', defaultValue: 'Edit' },
      { key: 'label3', label: 'Button 3', type: 'string', defaultValue: 'Delete' },
    ],
    render: (p) => (
      <ButtonGroup
        size="sm"
        buttonsProps={[
          { children: p.label1 as string, variant: 'outline' },
          { children: p.label2 as string, variant: 'outline' },
          { children: p.label3 as string, variant: 'outline' },
        ]}
      />
    ),
    code: (p) => `<ButtonGroup size="sm" buttonsProps={[\n  { children: "${p.label1}", variant: "outline" },\n  { children: "${p.label2}", variant: "outline" },\n  { children: "${p.label3}", variant: "outline" },\n]} />`,
  },

  // ── FORMS ─────────────────────────────────────────────────────────
  {
    id: 'text-input',
    name: 'Text Input',
    category: 'Forms',
    description: 'Single-line text field',
    props: [
      { key: 'placeholder', label: 'Placeholder', type: 'string', defaultValue: 'Enter value...' },
      { key: 'label', label: 'Label', type: 'string', defaultValue: 'Field label' },
      { key: 'disabled', label: 'Disabled', type: 'boolean', defaultValue: false },
      { key: 'optional', label: 'Optional', type: 'boolean', defaultValue: false },
    ],
    render: (p) => (
      <TextInput
        id="input-preview"
        label={p.label as string}
        placeholder={p.placeholder as string}
        disabled={!!p.disabled}
        optional={!!p.optional}
      />
    ),
    code: (p) => `<TextInput\n  id="my-input"\n  label="${p.label}"\n  placeholder="${p.placeholder}"${p.disabled ? '\n  disabled' : ''}${p.optional ? '\n  optional' : ''}\n/>`,
  },
  {
    id: 'textarea',
    name: 'Textarea',
    category: 'Forms',
    description: 'Multi-line text area',
    props: [
      { key: 'placeholder', label: 'Placeholder', type: 'string', defaultValue: 'Enter your message...' },
      { key: 'rows', label: 'Rows', type: 'range', defaultValue: 3, min: 2, max: 10, step: 1 },
      { key: 'disabled', label: 'Disabled', type: 'boolean', defaultValue: false },
    ],
    render: (p) => (
      <Textarea
        placeholder={p.placeholder as string}
        rows={p.rows as number}
        disabled={!!p.disabled}
      />
    ),
    code: (p) => `<Textarea\n  placeholder="${p.placeholder}"\n  rows={${p.rows}}${p.disabled ? '\n  disabled' : ''}\n/>`,
  },
  {
    id: 'checkbox',
    name: 'Checkbox',
    category: 'Forms',
    description: 'Binary selection input',
    props: [
      { key: 'label', label: 'Label', type: 'string', defaultValue: 'Accept terms and conditions' },
      { key: 'checked', label: 'Checked', type: 'boolean', defaultValue: false },
      { key: 'disabled', label: 'Disabled', type: 'boolean', defaultValue: false },
    ],
    render: (p) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Checkbox id="cb-preview" checked={!!p.checked} disabled={!!p.disabled} onCheckedChange={() => {}} />
        <label htmlFor="cb-preview" style={{ fontSize: 13, cursor: 'pointer', color: 'inherit' }}>{p.label as string}</label>
      </div>
    ),
    code: (p) => `<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>\n  <Checkbox id="my-cb" checked={${p.checked}} />\n  <label htmlFor="my-cb">${p.label}</label>\n</div>`,
  },
  {
    id: 'switch',
    name: 'Switch',
    category: 'Forms',
    description: 'Toggle on/off setting',
    props: [
      { key: 'label', label: 'Label', type: 'string', defaultValue: 'Enable notifications' },
      { key: 'checked', label: 'Checked', type: 'boolean', defaultValue: true },
      { key: 'disabled', label: 'Disabled', type: 'boolean', defaultValue: false },
    ],
    render: (p) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Switch id="sw-preview" checked={!!p.checked} disabled={!!p.disabled} onCheckedChange={() => {}} />
        <label htmlFor="sw-preview" style={{ fontSize: 13, cursor: 'pointer', color: 'inherit' }}>{p.label as string}</label>
      </div>
    ),
    code: (p) => `<div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>\n  <Switch id="my-sw" checked={${p.checked}} />\n  <label htmlFor="my-sw">${p.label}</label>\n</div>`,
  },
  {
    id: 'slider',
    name: 'Slider',
    category: 'Forms',
    description: 'Range selection input',
    props: [
      { key: 'value', label: 'Value', type: 'range', defaultValue: 40, min: 0, max: 100, step: 1 },
      { key: 'min', label: 'Min', type: 'number', defaultValue: 0 },
      { key: 'max', label: 'Max', type: 'number', defaultValue: 100 },
      { key: 'disabled', label: 'Disabled', type: 'boolean', defaultValue: false },
    ],
    render: (p) => (
      <Slider
        value={[p.value as number]}
        min={p.min as number}
        max={p.max as number}
        disabled={!!p.disabled}
        onValueChange={() => {}}
        style={{ width: 200 }}
      />
    ),
    code: (p) => `<Slider value={[${p.value}]} min={${p.min}} max={${p.max}} />`,
  },

  // ── DISPLAY ───────────────────────────────────────────────────────
  {
    id: 'alert',
    name: 'Alert',
    category: 'Display',
    description: 'Contextual feedback messages',
    props: [
      { key: 'title', label: 'Title', type: 'string', defaultValue: 'Heads up!' },
      { key: 'description', label: 'Description', type: 'string', defaultValue: 'Your build completed successfully.' },
      {
        key: 'theme', label: 'Theme', type: 'select', defaultValue: 'default',
        options: [
          { label: 'Default', value: 'default' },
          { label: 'Warning', value: 'warning' },
          { label: 'Danger', value: 'danger' },
          { label: 'Success', value: 'success' },
          { label: 'Info', value: 'info' },
        ],
      },
    ],
    render: (p) => (
      <Alert.Root theme={p.theme as any}>
        <Alert.Title>{p.title as string}</Alert.Title>
        <Alert.Description>{p.description as string}</Alert.Description>
      </Alert.Root>
    ),
    code: (p) => `<Alert.Root theme="${p.theme}">\n  <Alert.Title>${p.title}</Alert.Title>\n  <Alert.Description>${p.description}</Alert.Description>\n</Alert.Root>`,
  },
  {
    id: 'status-badge',
    name: 'Status Badge',
    category: 'Display',
    description: 'Status indicator with optional pulse',
    props: [
      { key: 'label', label: 'Label', type: 'string', defaultValue: 'Running' },
      {
        key: 'theme', label: 'Theme', type: 'select', defaultValue: 'success',
        options: [
          { label: 'Success', value: 'success' },
          { label: 'Warning', value: 'warning' },
          { label: 'Danger', value: 'danger' },
          { label: 'Muted', value: 'muted' },
          { label: 'Merged', value: 'merged' },
        ],
      },
      { key: 'pulse', label: 'Pulse', type: 'boolean', defaultValue: true },
    ],
    render: (p) => {
      const SB = StatusBadge as any
      return <SB theme={p.theme} variant="status" pulse={!!p.pulse}>{p.label as string}</SB>
    },
    code: (p) => `<StatusBadge theme="${p.theme}" variant="status"${p.pulse ? ' pulse' : ''}>\n  ${p.label}\n</StatusBadge>`,
  },
  {
    id: 'avatar',
    name: 'Avatar',
    category: 'Display',
    description: 'User avatar with initials fallback',
    props: [
      { key: 'name', label: 'Name', type: 'string', defaultValue: 'John Doe' },
      {
        key: 'size', label: 'Size', type: 'select', defaultValue: 'md',
        options: [
          { label: 'XS', value: 'xs' }, { label: 'Small', value: 'sm' },
          { label: 'Medium', value: 'md' }, { label: 'Large', value: 'lg' },
          { label: 'XL', value: 'xl' },
        ],
      },
      { key: 'rounded', label: 'Rounded', type: 'boolean', defaultValue: false },
    ],
    render: (p) => <Avatar name={p.name as string} size={p.size as any} rounded={!!p.rounded} />,
    code: (p) => `<Avatar name="${p.name}" size="${p.size}"${p.rounded ? ' rounded' : ''} />`,
  },
  {
    id: 'tag',
    name: 'Tag',
    category: 'Display',
    description: 'Label or keyword tag',
    props: [
      { key: 'label', label: 'Label', type: 'string', defaultValue: 'production' },
      {
        key: 'theme', label: 'Theme', type: 'select', defaultValue: 'muted',
        options: [
          { label: 'Muted', value: 'muted' },
          { label: 'Warning', value: 'warning' },
          { label: 'Success', value: 'success' },
          { label: 'Danger', value: 'danger' },
          { label: 'Info', value: 'info' },
        ],
      },
    ],
    render: (p) => <Tag theme={p.theme as any} value={p.label as string} />,
    code: (p) => `<Tag theme="${p.theme}" value="${p.label}" />`,
  },
  {
    id: 'progress',
    name: 'Progress',
    category: 'Display',
    description: 'Linear progress indicator',
    props: [
      { key: 'value', label: 'Value (%)', type: 'range', defaultValue: 65, min: 0, max: 100, step: 1 },
    ],
    render: (p) => <Progress value={p.value as number} style={{ width: 200 }} />,
    code: (p) => `<Progress value={${p.value}} />`,
  },
  {
    id: 'card',
    name: 'Card',
    category: 'Display',
    description: 'Container with header and content',
    props: [
      { key: 'title', label: 'Title', type: 'string', defaultValue: 'Repository' },
      { key: 'description', label: 'Description', type: 'string', defaultValue: 'A monorepo for the Harness UI system' },
      { key: 'footer', label: 'Footer', type: 'string', defaultValue: 'Updated 2 hours ago' },
    ],
    render: (p) => (
      <Card.Root style={{ width: 300 }}>
        <Card.Title>{p.title as string}</Card.Title>
        <Card.Content>
          <p style={{ fontSize: 13 }}>{p.description as string}</p>
          <p style={{ fontSize: 12, marginTop: 8, opacity: 0.5 }}>{p.footer as string}</p>
        </Card.Content>
      </Card.Root>
    ),
    code: (p) => `<Card.Root>\n  <Card.Title>${p.title}</Card.Title>\n  <Card.Content>\n    <p>${p.description}</p>\n    <p>${p.footer}</p>\n  </Card.Content>\n</Card.Root>`,
  },
  {
    id: 'separator',
    name: 'Separator',
    category: 'Display',
    description: 'Visual divider between sections',
    props: [
      {
        key: 'orientation', label: 'Orientation', type: 'select', defaultValue: 'horizontal',
        options: [
          { label: 'Horizontal', value: 'horizontal' },
          { label: 'Vertical', value: 'vertical' },
        ],
      },
    ],
    render: (p) => (
      <div style={{ display: 'flex', alignItems: 'center', width: p.orientation === 'horizontal' ? 240 : 'auto', height: p.orientation === 'vertical' ? 40 : 'auto' }}>
        <Separator orientation={p.orientation as any} style={p.orientation === 'horizontal' ? { width: '100%' } : { height: '100%' }} />
      </div>
    ),
    code: (p) => `<Separator orientation="${p.orientation}" />`,
  },

  // ── NAVIGATION ────────────────────────────────────────────────────
  {
    id: 'breadcrumb',
    name: 'Breadcrumb',
    category: 'Navigation',
    description: 'Hierarchical page location trail',
    props: [
      { key: 'item1', label: 'Item 1', type: 'string', defaultValue: 'Home' },
      { key: 'item2', label: 'Item 2', type: 'string', defaultValue: 'Projects' },
      { key: 'item3', label: 'Item 3 (current)', type: 'string', defaultValue: 'canary' },
    ],
    render: (p) => (
      <Breadcrumb.Root>
        <Breadcrumb.List>
          <Breadcrumb.Item>
            <Breadcrumb.Link href="#">{p.item1 as string}</Breadcrumb.Link>
          </Breadcrumb.Item>
          <Breadcrumb.Separator />
          <Breadcrumb.Item>
            <Breadcrumb.Link href="#">{p.item2 as string}</Breadcrumb.Link>
          </Breadcrumb.Item>
          <Breadcrumb.Separator />
          <Breadcrumb.Item>
            <Breadcrumb.Page>{p.item3 as string}</Breadcrumb.Page>
          </Breadcrumb.Item>
        </Breadcrumb.List>
      </Breadcrumb.Root>
    ),
    code: (p) => `<Breadcrumb.Root>\n  <Breadcrumb.List>\n    <Breadcrumb.Item><Breadcrumb.Link href="#">${p.item1}</Breadcrumb.Link></Breadcrumb.Item>\n    <Breadcrumb.Separator />\n    <Breadcrumb.Item><Breadcrumb.Link href="#">${p.item2}</Breadcrumb.Link></Breadcrumb.Item>\n    <Breadcrumb.Separator />\n    <Breadcrumb.Item><Breadcrumb.Page>${p.item3}</Breadcrumb.Page></Breadcrumb.Item>\n  </Breadcrumb.List>\n</Breadcrumb.Root>`,
  },
  {
    id: 'tabs',
    name: 'Tabs',
    category: 'Navigation',
    description: 'Tabbed content panels',
    props: [
      { key: 'tab1', label: 'Tab 1 label', type: 'string', defaultValue: 'Overview' },
      { key: 'tab2', label: 'Tab 2 label', type: 'string', defaultValue: 'Commits' },
      { key: 'tab3', label: 'Tab 3 label', type: 'string', defaultValue: 'Pull Requests' },
    ],
    render: (p) => (
      <Tabs.Root defaultValue="tab1">
        <Tabs.List>
          <Tabs.Trigger value="tab1">{p.tab1 as string}</Tabs.Trigger>
          <Tabs.Trigger value="tab2">{p.tab2 as string}</Tabs.Trigger>
          <Tabs.Trigger value="tab3">{p.tab3 as string}</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="tab1"><p style={{ fontSize: 13, marginTop: 12 }}>Overview content</p></Tabs.Content>
        <Tabs.Content value="tab2"><p style={{ fontSize: 13, marginTop: 12 }}>Commits content</p></Tabs.Content>
        <Tabs.Content value="tab3"><p style={{ fontSize: 13, marginTop: 12 }}>Pull Requests content</p></Tabs.Content>
      </Tabs.Root>
    ),
    code: (p) => `<Tabs.Root defaultValue="tab1">\n  <Tabs.List>\n    <Tabs.Trigger value="tab1">${p.tab1}</Tabs.Trigger>\n    <Tabs.Trigger value="tab2">${p.tab2}</Tabs.Trigger>\n    <Tabs.Trigger value="tab3">${p.tab3}</Tabs.Trigger>\n  </Tabs.List>\n  <Tabs.Content value="tab1">…</Tabs.Content>\n</Tabs.Root>`,
  },

  // ── CONTENT ───────────────────────────────────────────────────────
  {
    id: 'accordion',
    name: 'Accordion',
    category: 'Content',
    description: 'Expandable content sections',
    props: [
      { key: 'item1Title', label: 'Section 1 title', type: 'string', defaultValue: 'Getting Started' },
      { key: 'item1Content', label: 'Section 1 content', type: 'string', defaultValue: 'Follow the quickstart guide to get up and running.' },
      { key: 'item2Title', label: 'Section 2 title', type: 'string', defaultValue: 'Configuration' },
      { key: 'item2Content', label: 'Section 2 content', type: 'string', defaultValue: 'Customize behavior through the settings panel.' },
    ],
    render: (p) => (
      <Accordion.Root type="single" collapsible style={{ width: 300 }}>
        <Accordion.Item value="item1">
          <Accordion.Trigger>{p.item1Title as string}</Accordion.Trigger>
          <Accordion.Content><p style={{ fontSize: 13 }}>{p.item1Content as string}</p></Accordion.Content>
        </Accordion.Item>
        <Accordion.Item value="item2">
          <Accordion.Trigger>{p.item2Title as string}</Accordion.Trigger>
          <Accordion.Content><p style={{ fontSize: 13 }}>{p.item2Content as string}</p></Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>
    ),
    code: (p) => `<Accordion.Root type="single" collapsible>\n  <Accordion.Item value="item1">\n    <Accordion.Trigger>${p.item1Title}</Accordion.Trigger>\n    <Accordion.Content>${p.item1Content}</Accordion.Content>\n  </Accordion.Item>\n</Accordion.Root>`,
  },
]

export const CATEGORIES = [...new Set(REGISTRY.map(c => c.category))]

export function getDefaultProps(entry: ComponentEntry): Record<string, unknown> {
  return Object.fromEntries(entry.props.map(p => [p.key, p.defaultValue]))
}
