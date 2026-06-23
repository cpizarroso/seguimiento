import { useState, type ReactNode } from 'react';
import { Link } from '@inertiajs/react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { AreaTreeNode, Puesto } from '@/types/generated/Tramite';

interface TreeViewProps {
    items: AreaTreeNode[];
    search?: string;
    onDelete?: (item: AreaTreeNode) => void;
}

const ACENTOS: Record<string, string> = {
    a: 'aáàäâã', e: 'eéèëê', i: 'iíìïî',
    o: 'oóòöôõ', u: 'uúùüû', n: 'nñ',
};

function escapeRegex(s: string) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toPattern(s: string) {
    let result = '';
    for (const c of s.toLowerCase()) {
        const vars = ACENTOS[c];
        result += vars ? `[${vars}]` : escapeRegex(c);
    }
    return result;
}

function matchSearch(text: string | null | undefined, search: string): boolean {
    if (!text || !search) return false;
    const pattern = search.split(/\s+/).filter(Boolean).map((w) => toPattern(w)).join('|');
    return new RegExp(pattern, 'i').test(text);
}

function highlight(text: string | null | undefined, search: string): ReactNode {
    if (!text || !search) return text ?? '—';

    const palabras = search.split(/\s+/).filter(Boolean);
    if (palabras.length === 0) return text;

    const pattern = palabras.map((p) => toPattern(p)).join('|');
    const regex = new RegExp(`(${pattern})`, 'gi');

    return text.split(regex).map((parte, i) =>
        i % 2 === 1
            ? <mark key={i} className="bg-yellow-200 dark:bg-yellow-700 text-inherit rounded px-0.5">{parte}</mark>
            : parte,
    );
}

function PuestoBadge({ puesto, search }: { puesto: Puesto; search?: string }) {
    return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-patuju-green/10 dark:bg-patuju-green/20 text-xs font-medium text-patuju-green border border-patuju-green/25 dark:border-patuju-green/40 whitespace-nowrap shadow-sm">
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="font-semibold">{puesto.sigla}</span>
            <span className="text-patuju-green/70">—</span>
            <span>{puesto.nombre}</span>
        </span>
    );
}

function descendantMatches(node: AreaTreeNode, search: string): boolean {
    if (matchSearch(node.nombre, search) || matchSearch(node.sigla, search) || matchSearch(node.descripcion, search)) {
        return true;
    }
    return node.children.some((c) => descendantMatches(c, search));
}

function TreeNodeItem({
    node,
    depth,
    search,
    onDelete,
}: {
    node: AreaTreeNode;
    depth: number;
    search?: string;
    onDelete?: (item: AreaTreeNode) => void;
}) {
    const hasChildren = node.children.length > 0;
    const hasPuestos = (node.puestos?.length ?? 0) > 0;
    const hasContent = hasChildren || hasPuestos;
    const [expanded, setExpanded] = useState(false);

    const matches = matchSearch(node.nombre, search ?? '') ||
        matchSearch(node.sigla, search ?? '') ||
        matchSearch(node.descripcion, search ?? '');

    const childMatches = search
        ? node.children.some((c) => descendantMatches(c, search))
        : false;

    if (search && !matches && !childMatches) return null;

    const showExpanded = search ? (matches || childMatches) : expanded;

    return (
        <div>
            <div
                className="px-3 py-2 rounded-lg hover:bg-patuju-cream/50 dark:hover:bg-gray-700/50 transition-colors group"
                style={{ paddingLeft: `${depth * 24 + 12}px` }}
            >
                <div className="flex items-center gap-2">
                    {hasContent ? (
                        <button
                            type="button"
                            onClick={() => setExpanded(!expanded)}
                            className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-gray-500 hover:text-patuju-green transition-colors"
                        >
                            <svg
                                className={`w-3.5 h-3.5 transition-transform ${showExpanded ? 'rotate-90' : ''}`}
                                fill="none" stroke="currentColor" viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    ) : (
                        <span className="flex-shrink-0 w-5 h-5" />
                    )}

                    <Link
                        href={`/areas/${node.id}`}
                        className="font-medium text-patuju-green hover:underline flex-shrink-0"
                    >
                        {highlight(node.nombre, search ?? '')}
                    </Link>

                    <span className="font-mono text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
                        {highlight(node.sigla, search ?? '')}
                    </span>

                    {node.estado
                        ? <Badge variant="success">Activo</Badge>
                        : <Badge variant="danger">Inactivo</Badge>
                    }

                    <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/areas/${node.id}`}>
                            <Button size="sm" variant="secondary" className="gap-1 !px-2 !py-1">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            </Button>
                        </Link>
                        <Link href={`/areas/${node.id}/edit`}>
                            <Button size="sm" variant="secondary" className="gap-1 !px-2 !py-1">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                            </Button>
                        </Link>
                        {onDelete && (
                            <Button size="sm" variant="danger" className="gap-1 !px-2 !py-1" onClick={() => onDelete(node)}>
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {showExpanded && hasContent && (
                <div className="border-l-2 border-patuju-green/20 dark:border-gray-600 ml-[22px]">
                    {hasPuestos && (
                        <div className="flex items-center gap-1.5 flex-wrap py-2 pl-3">
                            {node.puestos.map((p) => (
                                <PuestoBadge key={p.id} puesto={p} search={search} />
                            ))}
                        </div>
                    )}
                    {node.children.map((child) => (
                        <TreeNodeItem
                            key={child.id}
                            node={child}
                            depth={depth + 1}
                            search={search}
                            onDelete={onDelete}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export function TreeView({ items, search, onDelete }: TreeViewProps) {
    if (items.length === 0) {
        return (
            <div className="py-8 text-center text-sm text-gray-400">
                No hay áreas registradas.
            </div>
        );
    }

    return (
        <div className="space-y-0.5">
            {items.map((node) => (
                <TreeNodeItem
                    key={node.id}
                    node={node}
                    depth={0}
                    search={search}
                    onDelete={onDelete}
                />
            ))}
        </div>
    );
}
