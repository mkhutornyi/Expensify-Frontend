import React, {useEffect} from 'react';
import {withOnyx} from 'react-native-onyx';
import FullScreenLoadingIndicator from '@components/FullscreenLoadingIndicator';
import ExpiredValidateCodeModal from '@components/ValidateCode/ExpiredValidateCodeModal';
import JustSignedInModal from '@components/ValidateCode/JustSignedInModal';
import ValidateCodeModal from '@components/ValidateCode/ValidateCodeModal';
import Navigation from '@libs/Navigation/Navigation';
import * as Session from '@userActions/Session';
import CONST from '@src/CONST';
import ONYXKEYS from '@src/ONYXKEYS';
import type {ValidateLoginPageOnyxProps, ValidateLoginPageProps} from './types';

function ValidateLoginPage({
    account,
    credentials,
    route: {
        params: {accountID, validateCode, exitTo},
    },
    session,
}: ValidateLoginPageProps<ValidateLoginPageOnyxProps>) {
    const login = credentials?.login;
    const autoAuthState = session?.autoAuthState ?? CONST.AUTO_AUTH_STATE.NOT_STARTED;
    const isSignedIn = !!session?.authToken && session?.authTokenType !== CONST.AUTH_TOKEN_TYPES.ANONYMOUS;
    const is2FARequired = !!account?.requiresTwoFactorAuth;
    const cachedAccountID = credentials?.accountID;

    useEffect(() => {
        if (!login && isSignedIn && (autoAuthState === CONST.AUTO_AUTH_STATE.SIGNING_IN || autoAuthState === CONST.AUTO_AUTH_STATE.JUST_SIGNED_IN)) {
            // The user clicked the option to sign in the current tab
            Navigation.isNavigationReady().then(() => {
                Navigation.goBack();
            });
            return;
        }
        Session.initAutoAuthState(autoAuthState);

        if (isSignedIn || (!login && !exitTo)) {
            if (exitTo) {
                Session.handleExitToNavigation(exitTo);
            }
            return;
        }

        // The user has initiated the sign in process on the same browser, in another tab.
        Session.signInWithValidateCode(Number(accountID), validateCode);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!!login || !cachedAccountID || !is2FARequired) {
            if (exitTo) {
                Session.handleExitToNavigation(exitTo);
            }
            return;
        }

        // The user clicked the option to sign in the current tab
        Navigation.isNavigationReady().then(() => {
            Navigation.goBack();
        });
    }, [login, cachedAccountID, is2FARequired, exitTo]);

    return (
        <>
            {autoAuthState === CONST.AUTO_AUTH_STATE.FAILED && <ExpiredValidateCodeModal />}
            {autoAuthState === CONST.AUTO_AUTH_STATE.JUST_SIGNED_IN && is2FARequired && !isSignedIn && <JustSignedInModal is2FARequired />}
            {autoAuthState === CONST.AUTO_AUTH_STATE.JUST_SIGNED_IN && isSignedIn && !exitTo && <JustSignedInModal is2FARequired={false} />}
            {autoAuthState === CONST.AUTO_AUTH_STATE.NOT_STARTED && !exitTo && (
                <ValidateCodeModal
                    accountID={Number(accountID)}
                    code={validateCode}
                />
            )}
            {autoAuthState === CONST.AUTO_AUTH_STATE.SIGNING_IN && <FullScreenLoadingIndicator />}
        </>
    );
}

ValidateLoginPage.displayName = 'ValidateLoginPage';

export default withOnyx<ValidateLoginPageProps<ValidateLoginPageOnyxProps>, ValidateLoginPageOnyxProps>({
    account: {key: ONYXKEYS.ACCOUNT},
    credentials: {key: ONYXKEYS.CREDENTIALS},
    session: {key: ONYXKEYS.SESSION},
})(ValidateLoginPage);
