import { useEffect, useState } from "react";
import { getModels } from "../api/client";

export default function ModelSwitcher({ value, onChange }) {
  const [models, setModels] = useState({});
  useEffect(() => { getModels().then(setModels); }, []);
  const providers = Object.keys(models);

  return (
    <div className="row">
      <select
        value={value.provider}
        onChange={e => onChange({ ...value, provider: e.target.value, model: "" })}
      >
        {providers.map(p => <option key={p} value={p}>{p}</option>)}
      </select>
      <select
        value={value.model}
        onChange={e => onChange({ ...value, model: e.target.value })}
      >
        {(models[value.provider] || []).map(m => <option key={m} value={m}>{m}</option>)}
      </select>
    </div>
  );
}
