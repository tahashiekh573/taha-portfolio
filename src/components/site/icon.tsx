import {
  Bot,
  Brain,
  Car,
  Code,
  Cpu,
  Database,
  FlaskConical,
  Hammer,
  Hand,
  LayoutDashboard,
  ScanFace,
  ScanLine,
  Server,
  ShieldCheck,
  Sparkles,
  Ticket,
  User,
  Users,
  Workflow,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export const ICONS: Record<string, LucideIcon> = {
  bot: Bot,
  brain: Brain,
  car: Car,
  code: Code,
  cpu: Cpu,
  database: Database,
  test: FlaskConical,
  hammer: Hammer,
  hand: Hand,
  layout: LayoutDashboard,
  "scan-face": ScanFace,
  scan: ScanLine,
  server: Server,
  shield: ShieldCheck,
  sparkles: Sparkles,
  ticket: Ticket,
  user: User,
  users: Users,
  workflow: Workflow,
  wrench: Wrench,
};

export const ICON_NAMES = Object.keys(ICONS);

export function Icon({ name, className }: { name?: string; className?: string }) {
  const C = (name && ICONS[name]) || Sparkles;
  return <C className={className} aria-hidden="true" />;
}
