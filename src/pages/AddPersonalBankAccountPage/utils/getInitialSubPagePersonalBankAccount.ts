import CONST from '@src/CONST';
import type {PersonalBankAccountForm} from '@src/types/form';

type Page = {pageName: string};

const SUB_PAGE_NAMES = CONST.ADD_PERSONAL_BANK_ACCOUNT.SUB_PAGE_NAMES;

/** The draft fields each sub-page collects. A sub-page counts as done once all of them have a value. */
const REQUIRED_FIELDS_BY_SUB_PAGE: Record<string, Array<keyof PersonalBankAccountForm>> = {
    [SUB_PAGE_NAMES.MANUAL_BANK_ACCOUNT_DETAILS]: ['routingNumber', 'accountNumber'],
    [SUB_PAGE_NAMES.PLAID_BANK_ACCOUNT]: ['selectedPlaidAccountID'],
    [SUB_PAGE_NAMES.LEGAL_NAME]: ['legalFirstName', 'legalLastName'],
    [SUB_PAGE_NAMES.ADDRESS]: ['addressStreet', 'addressCity', 'addressZipCode'],
    [SUB_PAGE_NAMES.PHONE_NUMBER]: ['phoneNumber'],
};

/**
 * Works out which sub-page to resume the Add Personal Bank Account flow on, by walking the pages in order and
 * stopping at the first one the saved draft has not answered yet. Mirrors getInitialSubstep in the international
 * deposit flow: the draft is the source of truth for progress, so there is no separate step index to keep in sync.
 *
 * Returns 0 for an empty draft, so a fresh setup still starts at the beginning.
 */
function getInitialSubPagePersonalBankAccount(pages: Page[], draft: PersonalBankAccountForm | undefined, skipPages: string[] = []): number {
    for (const [index, page] of pages.entries()) {
        if (skipPages.includes(page.pageName)) {
            continue;
        }

        // Confirmation is where a fully answered draft should land, and Success only ever shows after the request
        // succeeds, so neither has fields of its own to check.
        const requiredFields = REQUIRED_FIELDS_BY_SUB_PAGE[page.pageName];
        if (!requiredFields) {
            return index;
        }

        if (requiredFields.some((field) => !draft?.[field])) {
            return index;
        }
    }

    return 0;
}

export default getInitialSubPagePersonalBankAccount;
