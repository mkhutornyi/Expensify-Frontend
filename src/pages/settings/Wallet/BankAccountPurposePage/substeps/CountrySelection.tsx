import FormAlertWithSubmitButton from '@components/FormAlertWithSubmitButton';

import useLocalize from '@hooks/useLocalize';
import useOnyx from '@hooks/useOnyx';
import usePersonalPolicy from '@hooks/usePersonalPolicy';
import usePressLoading from '@hooks/usePressLoading';
import useThemeStyles from '@hooks/useThemeStyles';

import CountrySelectionList from '@pages/settings/Wallet/CountrySelectionList';

import {clearReimbursementAccount, clearReimbursementAccountDraft, navigateToBankAccountRoute, updateReimbursementAccountDraft} from '@userActions/ReimbursementAccount';

import type {Country} from '@src/CONST';
import CONST from '@src/CONST';
import ONYXKEYS from '@src/ONYXKEYS';
import ROUTES from '@src/ROUTES';

import React, {useMemo, useState} from 'react';

function CountrySelection() {
    const [country] = useOnyx(ONYXKEYS.COUNTRY);
    const [reimbursementAccountDraft] = useOnyx(ONYXKEYS.FORMS.REIMBURSEMENT_ACCOUNT_FORM_DRAFT);
    const personalPolicy = usePersonalPolicy();
    const {translate} = useLocalize();
    const styles = useThemeStyles();

    const initialCountry = useMemo(() => {
        const outputCurrency = personalPolicy?.outputCurrency;

        if (!outputCurrency) {
            return '';
        }

        if (CONST.BBA_EU_ORIGINAL_CURRENCY_COUNTRY_MAP[outputCurrency]) {
            return CONST.BBA_EU_ORIGINAL_CURRENCY_COUNTRY_MAP[outputCurrency];
        }

        const countriesWithCurrency = Object.entries(CONST.BBA_COUNTRY_CURRENCY_MAP)
            .filter(([, currency]) => currency === outputCurrency)
            .map(([countryCode]) => countryCode);

        if (countriesWithCurrency.length === 1) {
            return countriesWithCurrency.at(0) ?? '';
        }

        if (countriesWithCurrency.length > 1) {
            if (country && countriesWithCurrency.includes(country)) {
                return country;
            }
            return '';
        }

        const isSupportedCountry = !!country && !!CONST.BBA_COUNTRY_CURRENCY_MAP[country];

        return isSupportedCountry ? country : '';
    }, [personalPolicy?.outputCurrency, country]);

    const [selectedCountry, setSelectedCountry] = useState<string>(initialCountry);
    const [shouldShowError, setShouldShowError] = useState(false);
    const {isLoading, startWithLoading} = usePressLoading();

    const onCountrySelected = (countryChecked: string) => {
        setShouldShowError(false);
        setSelectedCountry(countryChecked);
    };

    const onConfirm = () => {
        if (!selectedCountry) {
            setShouldShowError(true);
            return;
        }
        startWithLoading(() => {
            // Passing back through this screen for the country that is already being set up is a re-entry into an
            // unfinished flow, so keep the draft and achData - ReimbursementAccountPage resumes from them. Picking a
            // different country is a genuinely new setup and still resets everything.
            if (reimbursementAccountDraft?.country !== selectedCountry) {
                clearReimbursementAccount();
                clearReimbursementAccountDraft();
            }
            updateReimbursementAccountDraft({country: selectedCountry as Country, currency: CONST.BBA_COUNTRY_CURRENCY_MAP[selectedCountry]});
            navigateToBankAccountRoute({backTo: ROUTES.SETTINGS_BANK_ACCOUNT_PURPOSE});
        });
    };

    return (
        <CountrySelectionList
            selectedCountry={selectedCountry}
            countries={CONST.BBA_SUPPORTED_COUNTRIES}
            onCountrySelected={onCountrySelected}
            onConfirm={onConfirm}
            footerContent={
                <FormAlertWithSubmitButton
                    buttonText={translate('common.next')}
                    shouldShowLoadingImmediatelyOnPress={false}
                    isLoading={isLoading}
                    onSubmit={onConfirm}
                    isAlertVisible={shouldShowError}
                    containerStyles={[!shouldShowError && styles.mt5]}
                    message={translate('workspace.companyCards.addNewCard.error.pleaseSelectCountry')}
                />
            }
        />
    );
}

CountrySelection.displayName = 'CountrySelection';

export default CountrySelection;
