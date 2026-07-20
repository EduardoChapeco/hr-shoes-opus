import * as React from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { MediaUploader } from "./MediaUploader";
import { ColorPicker } from "./ColorPicker";

interface ArrayField {
  name: string;
  label: string;
  type: string;
  options?: { label: string; value: string }[];
}

interface ArrayBuilderProps {
  value: any[];
  onChange: (value: any[]) => void;
  label?: string;
  arrayFields?: ArrayField[];
}

export function ArrayBuilder({ value = [], onChange, label, arrayFields = [] }: ArrayBuilderProps) {
  const items = Array.isArray(value) ? value : [];

  const handleAddItem = () => {
    const newItem: any = {};
    arrayFields.forEach(f => {
      newItem[f.name] = f.type === "boolean" ? false : "";
    });
    // Add unique internal ID for React keys so rearranging works smoothly
    newItem._id = crypto.randomUUID();
    onChange([...items, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    onChange(newItems);
  };

  const handleUpdateItem = (index: number, fieldName: string, fieldValue: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [fieldName]: fieldValue };
    onChange(newItems);
  };

  const moveItem = (index: number, direction: -1 | 1) => {
    if (index + direction < 0 || index + direction >= items.length) return;
    const newItems = [...items];
    const temp = newItems[index];
    newItems[index] = newItems[index + direction];
    newItems[index + direction] = temp;
    onChange(newItems);
  };

  return (
    <div className="flex flex-col gap-2">
      {label && <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase text-muted-foreground">{label}</label>
        <span className="text-xs text-muted-foreground">{items.length} itens</span>
      </div>}

      {items.length === 0 ? (
        <div className="text-xs text-center py-4 bg-muted/50 rounded-md text-muted-foreground border border-dashed">
          Nenhum item adicionado
        </div>
      ) : (
        <Accordion type="single" collapsible className="w-full space-y-2">
          {items.map((item, index) => (
            <AccordionItem key={item._id || index} value={`item-${index}`} className="border bg-card rounded-md overflow-hidden">
              <div className="flex items-center bg-muted/30 pr-2">
                <div className="flex flex-col border-r px-1 py-2 opacity-50 hover:opacity-100 cursor-ns-resize" onClick={(e) => { e.preventDefault(); }}>
                   {/* Simple up/down click since drag and drop requires dnd-kit which might be heavy here */}
                   <button onClick={(e) => { e.preventDefault(); moveItem(index, -1); }} className="p-0.5 hover:bg-muted rounded text-[10px]">▲</button>
                   <button onClick={(e) => { e.preventDefault(); moveItem(index, 1); }} className="p-0.5 hover:bg-muted rounded text-[10px]">▼</button>
                </div>
                <AccordionTrigger className="hover:no-underline py-2 px-3 flex-1 text-xs justify-start gap-2">
                  <span className="font-medium truncate flex-1 text-left">
                    Item {index + 1} {item.title || item.name || ""}
                  </span>
                </AccordionTrigger>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 text-destructive hover:bg-destructive/10 shrink-0"
                  onClick={(e) => {
                    e.preventDefault();
                    handleRemoveItem(index);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <AccordionContent className="p-3 border-t bg-card space-y-3">
                {arrayFields.map(field => (
                  <div key={field.name} className="flex flex-col gap-1.5">
                    {field.type === "image" ? (
                      <MediaUploader
                        label={field.label}
                        value={item[field.name] || ""}
                        onChange={(val) => handleUpdateItem(index, field.name, val)}
                      />
                    ) : field.type === "color" ? (
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase text-muted-foreground">{field.label}</label>
                        <ColorPicker
                          value={item[field.name] || ""}
                          onChange={(val) => handleUpdateItem(index, field.name, val)}
                        />
                      </div>
                    ) : field.type === "boolean" ? (
                      <label className="flex items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          checked={item[field.name] || false}
                          onChange={(e) => handleUpdateItem(index, field.name, e.target.checked)}
                          className="w-4 h-4"
                        />
                        {field.label}
                      </label>
                    ) : field.type === "select" && field.options ? (
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase text-muted-foreground">{field.label}</label>
                        <select
                          className="w-full text-sm p-2 rounded-lg border bg-background"
                          value={item[field.name] || ""}
                          onChange={(e) => handleUpdateItem(index, field.name, e.target.value)}
                        >
                          <option value="">Selecione...</option>
                          {field.options.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                    ) : field.type === "textarea" ? (
                      <textarea
                        className="w-full text-sm p-2 border rounded-md bg-background min-h-[80px]"
                        placeholder={field.label}
                        value={item[field.name] || ""}
                        onChange={(e) => handleUpdateItem(index, field.name, e.target.value)}
                      />
                    ) : (
                      <>
                        <label className="text-xs font-medium">{field.label}</label>
                        <Input
                          className="h-8 text-sm bg-background"
                          value={item[field.name] || ""}
                          onChange={(e) => handleUpdateItem(index, field.name, e.target.value)}
                        />
                      </>
                    )}
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
      
      <Button variant="outline" size="sm" className="w-full mt-2" onClick={handleAddItem}>
        <Plus className="h-4 w-4 mr-2" />
        Adicionar Item
      </Button>
    </div>
  );
}
