import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";

export interface KeyValuePair {
  key: string;
  value: string;
}

interface KeyValueEditorProps {
  pairs: KeyValuePair[];
  onChange: (pairs: KeyValuePair[]) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
  addLabel?: string;
}

/** Add/remove list of key-value rows (env vars, hyperparameters, etc.). */
export const KeyValueEditor = ({
  pairs,
  onChange,
  keyPlaceholder = "KEY",
  valuePlaceholder = "value",
  addLabel = "Add row",
}: KeyValueEditorProps) => {
  const update = (i: number, patch: Partial<KeyValuePair>) =>
    onChange(pairs.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  const remove = (i: number) => onChange(pairs.filter((_, idx) => idx !== i));
  const add = () => onChange([...pairs, { key: "", value: "" }]);

  return (
    <div className="space-y-2">
      {pairs.map((pair, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input
            value={pair.key}
            placeholder={keyPlaceholder}
            onChange={(e) => update(i, { key: e.target.value })}
            className="font-mono text-sm"
          />
          <Input
            value={pair.value}
            placeholder={valuePlaceholder}
            onChange={(e) => update(i, { value: e.target.value })}
            className="font-mono text-sm"
          />
          <Button variant="ghost" size="icon" onClick={() => remove(i)} type="button">
            <X className="w-4 h-4" />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={add} type="button">
        <Plus className="w-4 h-4 mr-1" />
        {addLabel}
      </Button>
    </div>
  );
};

export default KeyValueEditor;
