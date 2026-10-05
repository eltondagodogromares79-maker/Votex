import { cn } from "@/src/lib/utils";

interface RegistrationStep {
  number: number;
  label: string;
}

interface RegistrationStepsProps {
  steps: RegistrationStep[];
  currentStep: number;
}

export function RegistrationSteps({
  steps,
  currentStep,
}: RegistrationStepsProps) {
  return (
    <div
      className="flex items-center justify-between mb-8"
      role="list"
      aria-label="Registration steps"
    >
      {steps.map((step, index) => {
        const done = step.number < currentStep;
        const active = step.number === currentStep;

        return (
          <div
            key={step.number}
            className="flex items-center flex-1"
            role="listitem"
          >
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <div
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center",
                  "text-caption font-bold transition-all duration-200",
                  done && "bg-gold text-navy",
                  active &&
                    "bg-gold text-navy ring-2 ring-gold/30 ring-offset-2 ring-offset-navy",
                  !done &&
                    !active &&
                    "bg-white/10 text-white/35"
                )}
                aria-current={active ? "step" : undefined}
              >
                {done ? "✓" : step.number}
              </div>

              <span
                className={cn(
                  "text-[0.65rem] uppercase tracking-[0.1em]",
                  "font-semibold leading-none",
                  active
                    ? "text-gold"
                    : done
                      ? "text-gold/60"
                      : "text-white/25"
                )}
              >
                {step.label}
              </span>
            </div>

            {index < steps.length - 1 && (
              <div className="flex-1 mx-2 mt-[-0.8rem]">
                <div
                  className={cn(
                    "h-px transition-all duration-300",
                    done ? "bg-gold/50" : "bg-white/12"
                  )}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}