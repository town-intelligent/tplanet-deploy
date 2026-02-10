// src/pages/backend/components/ModuleRenderer.jsx
export default function ModuleRenderer({ moduleId, modules, onConfirm, onSend }) {
  const module = modules[moduleId];

  if (!module) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">模組不存在</p>
      </div>
    );
  }

  const ModuleComponent = module.component;

  return <ModuleComponent onConfirm={onConfirm} onSend={onSend} />;
}
