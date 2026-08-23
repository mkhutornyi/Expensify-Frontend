import HeaderWithBackButton from '@components/HeaderWithBackButton';
import Icon from '@components/Icon';
import LottieAnimations from '@components/LottieAnimations';
import MenuItem from '@components/MenuItem';
import PressableWithoutFeedback from '@components/Pressable/PressableWithoutFeedback';
import ScreenWrapper from '@components/ScreenWrapper';
import ScrollView from '@components/ScrollView';
import Section from '@components/Section';
import Text from '@components/Text';
import TextLink from '@components/TextLink';

import {useMemoizedLazyExpensifyIcons} from '@hooks/useLazyAsset';
import useLocalize from '@hooks/useLocalize';
import useOnyx from '@hooks/useOnyx';
import useResponsiveLayout from '@hooks/useResponsiveLayout';
import useTheme from '@hooks/useTheme';
import useThemeStyles from '@hooks/useThemeStyles';

import Navigation from '@navigation/Navigation';

import {clearPersonalBankAccount, updateAddPersonalBankAccountDraft} from '@userActions/BankAccounts';
import {openExternalLink} from '@userActions/Link';

import CONST from '@src/CONST';
import ONYXKEYS from '@src/ONYXKEYS';
import ROUTES from '@src/ROUTES';
import isLoadingOnyxValue from '@src/types/utils/isLoadingOnyxValue';

import React, {useEffect} from 'react';
import {View} from 'react-native';

type AccountFlowEntryPointProps = {
    /** The workspace name */
    policyName?: string;

    /** Goes to the previous step */
    onBackButtonPress: () => void;
};

function AccountFlowEntryPoint({policyName = '', onBackButtonPress}: AccountFlowEntryPointProps) {
    const theme = useTheme();
    const styles = useThemeStyles();
    const {translate} = useLocalize();
    const {shouldUseNarrowLayout} = useResponsiveLayout();
    const expensifyIcons = useMemoizedLazyExpensifyIcons(['Bank', 'Connect', 'Lightbulb', 'Lock']);

    const [isPlaidDisabled] = useOnyx(ONYXKEYS.IS_PLAID_DISABLED);
    const [personalBankAccount, personalBankAccountResult] = useOnyx(ONYXKEYS.PERSONAL_BANK_ACCOUNT);
    const [personalBankAccountDraft, personalBankAccountDraftResult] = useOnyx(ONYXKEYS.FORMS.PERSONAL_BANK_ACCOUNT_FORM_DRAFT);
    const isLoadingPersonalBankAccount = isLoadingOnyxValue(personalBankAccountResult, personalBankAccountDraftResult);
    const onSuccessFallbackRoute = personalBankAccount?.onSuccessFallbackRoute;
    const setupTypeInProgress = personalBankAccountDraft?.setupType;

    useEffect(() => {
        if (isLoadingPersonalBankAccount) {
            return;
        }

        // An unfinished setup is resumed, not restarted, so leave its draft alone. Reaching this screen with a setup
        // type already saved means the user dismissed the RHP mid-flow - every deliberate way out of the flow clears
        // the draft through exitFlow first.
        if (setupTypeInProgress) {
            return;
        }

        // Clear stale flow state on entry while preserving onSuccessFallbackRoute if it was set before entering this screen (e.g. from a pay/KYC flow or deep link).
        // openPersonalBankAccountSetupView also resets state, but this handles direct navigation to this screen.
        clearPersonalBankAccount(onSuccessFallbackRoute ? {onSuccessFallbackRoute} : undefined);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoadingPersonalBankAccount]);

    const navigateToSetup = (setupType: string, firstSubPage: string) => {
        updateAddPersonalBankAccountDraft({setupType});
        // Picking the same setup type the unfinished draft already uses is a resume, so navigate without a sub-page and
        // let the flow pick up where the user left off. A new setup still opens on its first sub-page, which also avoids
        // racing the setupType merge above (the flow reads it to decide which sub-pages to show).
        const isResumingSetupType = setupTypeInProgress === setupType;
        Navigation.navigate(ROUTES.SETTINGS_ADD_US_BANK_ACCOUNT.getRoute(isResumingSetupType ? undefined : firstSubPage));
    };

    const handleConnectManually = () => {
        navigateToSetup(CONST.BANK_ACCOUNT.SETUP_TYPE.MANUAL, CONST.ADD_PERSONAL_BANK_ACCOUNT.SUB_PAGE_NAMES.MANUAL_BANK_ACCOUNT_DETAILS);
    };

    const handleConnectPlaid = () => {
        navigateToSetup(CONST.BANK_ACCOUNT.SETUP_TYPE.PLAID, CONST.ADD_PERSONAL_BANK_ACCOUNT.SUB_PAGE_NAMES.PLAID_BANK_ACCOUNT);
    };

    return (
        <ScreenWrapper
            includeSafeAreaPaddingBottom={false}
            testID={AccountFlowEntryPoint.displayName}
        >
            <HeaderWithBackButton
                title={translate('bankAccount.addBankAccount')}
                subtitle={policyName}
                onBackButtonPress={onBackButtonPress}
            />

            <ScrollView style={styles.flex1}>
                <Section
                    title={translate('workspace.bankAccount.streamlinePayments')}
                    titleStyles={styles.textHeadline}
                    subtitle={translate('addPersonalBankAccount.toGetStarted')}
                    subtitleStyles={styles.textSupporting}
                    subtitleMuted
                    illustration={LottieAnimations.FastMoney}
                    illustrationBackgroundColor={theme.fallbackIconColor}
                    isCentralPane
                >
                    <View style={[styles.flexRow, styles.mt4, styles.alignItemsCenter, styles.pb1, styles.pt1]}>
                        <Icon
                            src={expensifyIcons.Lightbulb}
                            fill={theme.icon}
                            additionalStyles={styles.mr2}
                            size={CONST.ICON_SIZE.MEDIUM}
                        />
                        <Text
                            style={[styles.textLabelSupportingNormal, styles.flex1]}
                            suppressHighlighting
                        >
                            {translate('workspace.bankAccount.connectBankAccountNote')}
                        </Text>
                    </View>
                    <View style={styles.mt4}>
                        <MenuItem
                            title={translate('bankAccount.connectOnlineWithPlaid')}
                            icon={expensifyIcons.Bank}
                            disabled={!!isPlaidDisabled}
                            onPress={handleConnectPlaid}
                            shouldShowRightIcon
                            outerWrapperStyle={shouldUseNarrowLayout ? styles.mhn5 : styles.mhn8}
                        />
                        <MenuItem
                            title={translate('bankAccount.connectManually')}
                            icon={expensifyIcons.Connect}
                            onPress={handleConnectManually}
                            shouldShowRightIcon
                            outerWrapperStyle={shouldUseNarrowLayout ? styles.mhn5 : styles.mhn8}
                        />
                    </View>
                </Section>
                <View style={[styles.mv0, styles.mh5, styles.flexRow, styles.justifyContentBetween]}>
                    <TextLink href={CONST.OLD_DOT_PUBLIC_URLS.PRIVACY_URL}>{translate('common.privacy')}</TextLink>
                    <PressableWithoutFeedback
                        onPress={() => openExternalLink(CONST.ENCRYPTION_AND_SECURITY_HELP_URL)}
                        style={[styles.flexRow, styles.alignItemsCenter]}
                        accessibilityLabel={translate('bankAccount.yourDataIsSecure')}
                        sentryLabel={CONST.SENTRY_LABEL.BANK_ACCOUNT.DATA_SECURE_LINK}
                    >
                        <TextLink href={CONST.ENCRYPTION_AND_SECURITY_HELP_URL}>{translate('bankAccount.yourDataIsSecure')}</TextLink>
                        <View style={styles.ml1}>
                            <Icon
                                src={expensifyIcons.Lock}
                                fill={theme.link}
                            />
                        </View>
                    </PressableWithoutFeedback>
                </View>
            </ScrollView>
        </ScreenWrapper>
    );
}

AccountFlowEntryPoint.displayName = 'AccountFlowEntryPoint';

export default AccountFlowEntryPoint;
