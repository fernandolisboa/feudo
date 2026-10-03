import { Checkbox } from "@/ui/checkbox";
import { Label } from "@/ui/label";
import { t } from "../strings";
import { PRIVACY_POLICY_ROUTE, TERMS_ROUTE } from "../terms";

const linkClassName = "text-brand hover:text-brand-hover underline underline-offset-4";

// The documents open in a new tab so a half-filled form is not lost.
export function TermsCheckbox() {
  return (
    <div className="flex items-start gap-2">
      <Checkbox id="termsAccepted" name="termsAccepted" className="mt-0.5" />
      <Label htmlFor="termsAccepted" className="text-sm leading-normal font-normal">
        <span>
          {t.signUp.termsLabelBefore}
          <a href={TERMS_ROUTE} target="_blank" rel="noopener" className={linkClassName}>
            {t.signUp.termsLink}
          </a>
          {t.signUp.termsLabelBetween}
          <a href={PRIVACY_POLICY_ROUTE} target="_blank" rel="noopener" className={linkClassName}>
            {t.signUp.privacyLink}
          </a>
        </span>
      </Label>
    </div>
  );
}
