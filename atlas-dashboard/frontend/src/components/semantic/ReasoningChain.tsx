import { Brain, ArrowRight } from 'lucide-react'

interface ReasoningChainProps {
  chain: string[]
}

export default function ReasoningChain({ chain }: ReasoningChainProps) {
  if (!chain || chain.length === 0) return null

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-5 h-5 text-purple-400" />
        <h3 className="font-semibold text-white">Reasoning Chain</h3>
      </div>
      <div className="space-y-2">
        {chain.map((step, idx) => (
          <div key={idx} className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/20 border border-purple-500/50 flex items-center justify-center text-xs text-purple-300 font-semibold">
              {idx + 1}
            </div>
            <p className="text-sm text-slate-300 flex-1">{step}</p>
            {idx < chain.length - 1 && (
              <ArrowRight className="w-4 h-4 text-slate-500 mt-1" />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
