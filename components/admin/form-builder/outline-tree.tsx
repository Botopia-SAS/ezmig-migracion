'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useFormBuilderStore, type SelectedNode } from '@/lib/stores/form-builder-store';
import { useAddElementDialogContext } from './add-element-dialog-provider';
import {
  ChevronDown,
  ChevronRight,
  Plus,
  GripVertical,
  GitBranch,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { FIELD_TYPE_ICON } from './field-icons';
import { cn } from '@/lib/utils';

// DnD imports
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export function OutlineTree() {
  const t = useTranslations('admin.formBuilder.outline');
  const schema = useFormBuilderStore((s) => s.schema);
  const selectedNode = useFormBuilderStore((s) => s.selectedNode);
  const selectNode = useFormBuilderStore((s) => s.selectNode);
  const reorderParts = useFormBuilderStore((s) => s.reorderParts);
  const { requestAddPart } = useAddElementDialogContext();

  const [expandedParts, setExpandedParts] = useState<Set<string>>(new Set(schema.parts.map((p) => p.id)));
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function togglePart(partId: string) {
    setExpandedParts((prev) => {
      const next = new Set(prev);
      next.has(partId) ? next.delete(partId) : next.add(partId);
      return next;
    });
  }

  function toggleSection(key: string) {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  function isSelected(node: SelectedNode) {
    if (!selectedNode) return false;
    if (node.type !== selectedNode.type) return false;
    if (node.partId !== selectedNode.partId) return false;
    if (node.sectionId !== selectedNode.sectionId) return false;
    if (node.fieldId !== selectedNode.fieldId) return false;
    return true;
  }

  function handlePartDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const fromIndex = schema.parts.findIndex((p) => p.id === active.id);
    const toIndex = schema.parts.findIndex((p) => p.id === over.id);
    if (fromIndex !== -1 && toIndex !== -1) {
      reorderParts(fromIndex, toIndex);
    }
  }

  return (
    <div className="w-60 border-r border-gray-200 bg-white flex flex-col shrink-0 overflow-hidden">
      <div className="px-3 py-2.5 border-b border-gray-100 flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          {t('title')}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-1 py-1">
        {schema.parts.length === 0 ? (
          <p className="text-xs text-gray-400 px-3 py-4 text-center">{t('emptyParts')}</p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handlePartDragEnd}>
            <SortableContext items={schema.parts.map((p) => p.id)} strategy={verticalListSortingStrategy}>
              {schema.parts.map((part) => (
                <PartNode
                  key={part.id}
                  part={part}
                  isExpanded={expandedParts.has(part.id)}
                  expandedSections={expandedSections}
                  onToggle={() => togglePart(part.id)}
                  onToggleSection={toggleSection}
                  isSelected={isSelected}
                  selectNode={selectNode}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>

      <div className="px-2 py-2 border-t border-gray-100">
        <Button
          variant="ghost"
          size="sm"
          onClick={requestAddPart}
          className="w-full text-xs text-gray-500 hover:text-violet-600"
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          {t('addPart')}
        </Button>
      </div>
    </div>
  );
}

// ---- Part Node ----

interface PartNodeProps {
  part: { id: string; title: string; sections: { id: string; title: string; fields: { id: string; label: string; type: string; required?: boolean; conditionalDisplay?: unknown }[] }[] };
  isExpanded: boolean;
  expandedSections: Set<string>;
  onToggle: () => void;
  onToggleSection: (key: string) => void;
  isSelected: (node: SelectedNode) => boolean;
  selectNode: (node: SelectedNode | null) => void;
}

function PartNode({ part, isExpanded, expandedSections, onToggle, onToggleSection, isSelected, selectNode }: PartNodeProps) {
  const t = useTranslations('admin.formBuilder.outline');
  const removePart = useFormBuilderStore((s) => s.removePart);
  const reorderSections = useFormBuilderStore((s) => s.reorderSections);
  const { requestAddSection } = useAddElementDialogContext();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: part.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  const selected = isSelected({ type: 'part', partId: part.id });

  function handleSectionDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const fromIndex = part.sections.findIndex((s) => s.id === active.id);
    const toIndex = part.sections.findIndex((s) => s.id === over.id);
    if (fromIndex !== -1 && toIndex !== -1) {
      reorderSections(part.id, fromIndex, toIndex);
    }
  }

  return (
    <div ref={setNodeRef} style={style} className="mb-0.5">
      <div
        className={cn(
          'flex items-center gap-1 px-1 py-1 rounded text-sm cursor-pointer hover:bg-gray-50 group',
          selected && 'bg-violet-50 text-violet-700'
        )}
      >
        <button type="button" {...attributes} {...listeners} className="cursor-grab text-gray-300 hover:text-gray-500 shrink-0">
          <GripVertical className="h-3.5 w-3.5" />
        </button>
        <button type="button" onClick={onToggle} className="shrink-0">
          {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        </button>
        <button
          type="button"
          onClick={() => selectNode({ type: 'part', partId: part.id })}
          className="flex-1 text-left truncate text-xs font-medium"
        >
          {part.title}
        </button>
        <button
          type="button"
          onClick={() => requestAddSection(part.id)}
          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-violet-600 shrink-0"
          title={t('addSection')}
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>

      {isExpanded && (
        <div className="ml-4">
          {part.sections.length === 0 ? (
            <p className="text-[10px] text-gray-400 px-2 py-1">{t('emptySections')}</p>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSectionDragEnd}>
              <SortableContext items={part.sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                {part.sections.map((section) => (
                  <SectionNode
                    key={section.id}
                    partId={part.id}
                    section={section}
                    isExpanded={expandedSections.has(`${part.id}.${section.id}`)}
                    onToggle={() => onToggleSection(`${part.id}.${section.id}`)}
                    isSelected={isSelected}
                    selectNode={selectNode}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </div>
      )}
    </div>
  );
}

// ---- Section Node ----

interface SectionNodeProps {
  partId: string;
  section: { id: string; title: string; fields: { id: string; label: string; type: string; required?: boolean; conditionalDisplay?: unknown }[] };
  isExpanded: boolean;
  onToggle: () => void;
  isSelected: (node: SelectedNode) => boolean;
  selectNode: (node: SelectedNode | null) => void;
}

function SectionNode({ partId, section, isExpanded, onToggle, isSelected, selectNode }: SectionNodeProps) {
  const t = useTranslations('admin.formBuilder.outline');
  const addField = useFormBuilderStore((s) => s.addField);
  const reorderFields = useFormBuilderStore((s) => s.reorderFields);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  const selected = isSelected({ type: 'section', partId, sectionId: section.id });

  function handleFieldDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const fromIndex = section.fields.findIndex((f) => f.id === active.id);
    const toIndex = section.fields.findIndex((f) => f.id === over.id);
    if (fromIndex !== -1 && toIndex !== -1) {
      reorderFields(partId, section.id, fromIndex, toIndex);
    }
  }

  return (
    <div ref={setNodeRef} style={style} className="mb-0.5">
      <div
        className={cn(
          'flex items-center gap-1 px-1 py-1 rounded text-xs cursor-pointer hover:bg-gray-50 group',
          selected && 'bg-violet-50 text-violet-700'
        )}
      >
        <button type="button" {...attributes} {...listeners} className="cursor-grab text-gray-300 hover:text-gray-500 shrink-0">
          <GripVertical className="h-3 w-3" />
        </button>
        <button type="button" onClick={onToggle} className="shrink-0">
          {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </button>
        <button
          type="button"
          onClick={() => selectNode({ type: 'section', partId, sectionId: section.id })}
          className="flex-1 text-left truncate"
        >
          {section.title}
        </button>
        <span className="text-[10px] text-gray-400 shrink-0">{section.fields.length}</span>
      </div>

      {isExpanded && (
        <div className="ml-4">
          {section.fields.length === 0 ? (
            <p className="text-[10px] text-gray-400 px-2 py-1">{t('emptyFields')}</p>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleFieldDragEnd}>
              <SortableContext items={section.fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
                {section.fields.map((field) => (
                  <FieldNode
                    key={field.id}
                    partId={partId}
                    sectionId={section.id}
                    field={field}
                    isSelected={isSelected}
                    selectNode={selectNode}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </div>
      )}
    </div>
  );
}

// ---- Field Node ----

interface FieldNodeProps {
  partId: string;
  sectionId: string;
  field: { id: string; label: string; type: string; required?: boolean; conditionalDisplay?: unknown };
  isSelected: (node: SelectedNode) => boolean;
  selectNode: (node: SelectedNode | null) => void;
}

function FieldNode({ partId, sectionId, field, isSelected, selectNode }: FieldNodeProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  const selected = isSelected({ type: 'field', partId, sectionId, fieldId: field.id });
  const Icon = FIELD_TYPE_ICON[field.type as keyof typeof FIELD_TYPE_ICON] || FIELD_TYPE_ICON.text;

  return (
    <div ref={setNodeRef} style={style}>
      <div
        className={cn(
          'flex items-center gap-1 px-1 py-0.5 rounded text-[11px] cursor-pointer hover:bg-gray-50 group',
          selected && 'bg-violet-50 text-violet-700'
        )}
      >
        <button type="button" {...attributes} {...listeners} className="cursor-grab text-gray-300 hover:text-gray-500 shrink-0">
          <GripVertical className="h-2.5 w-2.5" />
        </button>
        <Icon className="h-3 w-3 text-gray-400 shrink-0" />
        <button
          type="button"
          onClick={() => selectNode({ type: 'field', partId, sectionId, fieldId: field.id })}
          className="flex-1 text-left truncate"
        >
          {field.label}
        </button>
        {field.required && <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />}
        {!!field.conditionalDisplay && <GitBranch className="h-2.5 w-2.5 text-amber-500 shrink-0" />}
      </div>
    </div>
  );
}
