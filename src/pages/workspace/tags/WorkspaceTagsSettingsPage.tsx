import type {StackScreenProps} from '@react-navigation/stack';
import React, {useCallback, useMemo} from 'react';
import {View} from 'react-native';
import type {OnyxEntry} from 'react-native-onyx';
import {withOnyx} from 'react-native-onyx';
import HeaderWithBackButton from '@components/HeaderWithBackButton';
import MenuItemWithTopDescription from '@components/MenuItemWithTopDescription';
import OfflineWithFeedback from '@components/OfflineWithFeedback';
import ScreenWrapper from '@components/ScreenWrapper';
import Switch from '@components/Switch';
import Text from '@components/Text';
import useLocalize from '@hooks/useLocalize';
import useThemeStyles from '@hooks/useThemeStyles';
import * as Policy from '@libs/actions/Policy';
import Navigation from '@libs/Navigation/Navigation';
import * as PolicyUtils from '@libs/PolicyUtils';
import type {SettingsNavigatorParamList} from '@navigation/types';
import AdminPolicyAccessOrNotFoundWrapper from '@pages/workspace/AdminPolicyAccessOrNotFoundWrapper';
import PaidPolicyAccessOrNotFoundWrapper from '@pages/workspace/PaidPolicyAccessOrNotFoundWrapper';
import ONYXKEYS from '@src/ONYXKEYS';
import ROUTES from '@src/ROUTES';
import type SCREENS from '@src/SCREENS';
import type * as OnyxTypes from '@src/types/onyx';

type WorkspaceTagsSettingsPageOnyxProps = {
    /** Collection of tags attached to a policy */
    policyTags: OnyxEntry<OnyxTypes.PolicyTagList>;
};
type WorkspaceTagsSettingsPageProps = WorkspaceTagsSettingsPageOnyxProps & StackScreenProps<SettingsNavigatorParamList, typeof SCREENS.WORKSPACE.TAGS_SETTINGS>;

function WorkspaceTagsSettingsPage({route, policyTags}: WorkspaceTagsSettingsPageProps) {
    const styles = useThemeStyles();
    const {translate} = useLocalize();
    const policyTagName = useMemo(() => PolicyUtils.getTagLists(policyTags)?.[0]?.name ?? '', [policyTags]);

    const updateWorkspaceRequiresTag = useCallback(
        (value: boolean) => {
            Policy.setPolicyRequiresTag(route.params.policyID, value);
        },
        [route.params.policyID],
    );

    return (
        <AdminPolicyAccessOrNotFoundWrapper policyID={route.params.policyID}>
            <PaidPolicyAccessOrNotFoundWrapper policyID={route.params.policyID}>
                {({policy}) => (
                    <ScreenWrapper
                        includeSafeAreaPaddingBottom={false}
                        style={[styles.defaultModalContainer]}
                        testID={WorkspaceTagsSettingsPage.displayName}
                    >
                        <HeaderWithBackButton title={translate('common.settings')} />
                        <View style={styles.flexGrow1}>
                            <OfflineWithFeedback
                                errors={policy?.errorFields?.requiresTag}
                                pendingAction={policy?.pendingFields?.requiresTag}
                                errorRowStyles={styles.mh5}
                            >
                                <View style={[styles.mt2, styles.mh4]}>
                                    <View style={[styles.flexRow, styles.mb5, styles.mr2, styles.alignItemsCenter, styles.justifyContentBetween]}>
                                        <Text style={[styles.textNormal, styles.colorMuted]}>{translate('workspace.tags.requiresTag')}</Text>
                                        <Switch
                                            isOn={policy?.requiresTag ?? false}
                                            accessibilityLabel={translate('workspace.tags.requiresTag')}
                                            onToggle={updateWorkspaceRequiresTag}
                                        />
                                    </View>
                                </View>
                            </OfflineWithFeedback>
                            <OfflineWithFeedback
                                errors={policyTags?.[policyTagName]?.errors}
                                pendingAction={policyTags?.[policyTagName]?.pendingAction}
                                errorRowStyles={styles.mh5}
                            >
                                <MenuItemWithTopDescription
                                    title={policyTagName}
                                    description={translate(`workspace.tags.customTagName`)}
                                    onPress={() => Navigation.navigate(ROUTES.WORKSPACE_EDIT_TAGS.getRoute(route.params.policyID))}
                                />
                            </OfflineWithFeedback>
                        </View>
                    </ScreenWrapper>
                )}
            </PaidPolicyAccessOrNotFoundWrapper>
        </AdminPolicyAccessOrNotFoundWrapper>
    );
}

WorkspaceTagsSettingsPage.displayName = 'WorkspaceTagsSettingsPage';

export default withOnyx<WorkspaceTagsSettingsPageProps, WorkspaceTagsSettingsPageOnyxProps>({
    policyTags: {
        key: ({route}) => `${ONYXKEYS.COLLECTION.POLICY_TAGS}${route.params.policyID}`,
    },
})(WorkspaceTagsSettingsPage);
