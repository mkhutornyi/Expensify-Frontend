import React, {memo} from 'react';
import {View} from 'react-native';
import lodashGet from 'lodash/get';
import {withOnyx} from 'react-native-onyx';
import PropTypes from 'prop-types';
import Animated, {useSharedValue, useAnimatedStyle, useAnimatedSensor, SensorType, withSpring} from 'react-native-reanimated';
import ONYXKEYS from '../../../ONYXKEYS';
import ReportWelcomeText from '../../../components/ReportWelcomeText';
import participantPropTypes from '../../../components/participantPropTypes';
import * as ReportUtils from '../../../libs/ReportUtils';
import styles from '../../../styles/styles';
import OfflineWithFeedback from '../../../components/OfflineWithFeedback';
import * as Report from '../../../libs/actions/Report';
import reportPropTypes from '../../reportPropTypes';
import EmptyStateBackgroundImage from '../../../../assets/images/empty-state_background-fade.png';
import * as StyleUtils from '../../../styles/StyleUtils';
import withWindowDimensions, {windowDimensionsPropTypes} from '../../../components/withWindowDimensions';
import compose from '../../../libs/compose';
import withLocalize from '../../../components/withLocalize';
import PressableWithoutFeedback from '../../../components/Pressable/PressableWithoutFeedback';
import useWindowDimensions from '../../../hooks/useWindowDimensions';
import MultipleAvatars from '../../../components/MultipleAvatars';
import CONST from '../../../CONST';

const propTypes = {
    /** The id of the report */
    reportID: PropTypes.string.isRequired,

    /** The report currently being looked at */
    report: reportPropTypes,

    /** Personal details of all the users */
    personalDetails: PropTypes.objectOf(participantPropTypes),

    /** The policy object for the current route */
    policy: PropTypes.shape({
        /** The name of the policy */
        name: PropTypes.string,

        /** The URL for the policy avatar */
        avatar: PropTypes.string,
    }),

    ...windowDimensionsPropTypes,
};
const defaultProps = {
    report: {},
    personalDetails: {},
    policy: {},
};

function ReportActionItemCreated(props) {
    const {windowWidth, isSmallScreenWidth} = useWindowDimensions();

    const IMAGE_OFFSET_X = windowWidth / 2;
    const IMAGE_OFFSET_Y = 75;
    const ANIMATION_BOOST = 1.3;

    // Get data from phone rotation sensor and prep other variables for animation
    const animatedSensor = useAnimatedSensor(SensorType.GYROSCOPE);
    const moveXoffset = useSharedValue(0);
    const moveYoffset = useSharedValue(0);
    const backgroundImageOffsetX = useSharedValue(-IMAGE_OFFSET_X);

    // Apply data to create style object
    const animatedStyles = useAnimatedStyle(() => {
        /*
         * We use pitch and roll instead of x and y because Reanimated makes these consistent across iOS and Android by standardizing on the iOS convention.
         * For a visualization of what these values mean: https://howthingsfly.si.edu/flight-dynamics/roll-pitch-and-yaw
         * These values are in radians
         */
        const {x, y} = animatedSensor.sensor.value;
        // The x vs y here seems wrong but is the way to make it feel right to the user
        moveXoffset.value = Math.min(IMAGE_OFFSET_X, Math.max(-IMAGE_OFFSET_X, moveXoffset.value - y * ANIMATION_BOOST));
        moveYoffset.value = Math.min(IMAGE_OFFSET_Y, Math.max(-IMAGE_OFFSET_Y, moveYoffset.value - x * ANIMATION_BOOST));
        if (isSmallScreenWidth) {
            return {
                transform: [{translateX: withSpring(backgroundImageOffsetX.value - moveXoffset.value)}, {translateY: withSpring(moveYoffset.value)}],
            };
        }
        return {};
    });

    if (!ReportUtils.isChatReport(props.report)) {
        return null;
    }

    const icons = ReportUtils.getIcons(props.report, props.personalDetails);

    return (
        <OfflineWithFeedback
            pendingAction={lodashGet(props.report, 'pendingFields.addWorkspaceRoom') || lodashGet(props.report, 'pendingFields.createChat')}
            errors={lodashGet(props.report, 'errorFields.addWorkspaceRoom') || lodashGet(props.report, 'errorFields.createChat')}
            errorRowStyles={[styles.ml10, styles.mr2]}
            onClose={() => Report.navigateToConciergeChatAndDeleteReport(props.report.reportID)}
        >
            <View style={StyleUtils.getReportWelcomeContainerStyle(props.isSmallScreenWidth)}>
                <Animated.Image
                    pointerEvents="none"
                    source={EmptyStateBackgroundImage}
                    style={[StyleUtils.getReportWelcomeBackgroundImageStyle(props.isSmallScreenWidth), animatedStyles]}
                />
                <View
                    accessibilityLabel={props.translate('accessibilityHints.chatWelcomeMessage')}
                    style={[styles.p5, StyleUtils.getReportWelcomeTopMarginStyle(props.isSmallScreenWidth)]}
                >
                    <PressableWithoutFeedback
                        onPress={() => ReportUtils.navigateToDetailsPage(props.report)}
                        style={[styles.mh5, styles.mb3, styles.alignSelfStart]}
                        accessibilityLabel={props.translate('common.details')}
                        accessibilityRole={CONST.ACCESSIBILITY_ROLE.BUTTON}
                    >
                        <MultipleAvatars
                            icons={icons}
                            size={props.isLargeScreenWidth || (icons && icons.length < 3) ? CONST.AVATAR_SIZE.LARGE : CONST.AVATAR_SIZE.MEDIUM}
                            shouldStackHorizontally
                            shouldDisplayAvatarsInRows={props.isSmallScreenWidth}
                            maxAvatarsInRow={props.isSmallScreenWidth ? CONST.AVATAR_ROW_SIZE.DEFAULT : CONST.AVATAR_ROW_SIZE.LARGE_SCREEN}
                        />
                    </PressableWithoutFeedback>
                    <View style={[styles.ph5]}>
                        <ReportWelcomeText report={props.report} />
                    </View>
                </View>
            </View>
        </OfflineWithFeedback>
    );
}

ReportActionItemCreated.defaultProps = defaultProps;
ReportActionItemCreated.propTypes = propTypes;
ReportActionItemCreated.displayName = 'ReportActionItemCreated';

export default compose(
    withWindowDimensions,
    withLocalize,
    withOnyx({
        report: {
            key: ({reportID}) => `${ONYXKEYS.COLLECTION.REPORT}${reportID}`,
        },
        personalDetails: {
            key: ONYXKEYS.PERSONAL_DETAILS_LIST,
        },
        policy: {
            key: ({policyID}) => `${ONYXKEYS.COLLECTION.POLICY}${policyID}`,
        },
    }),
)(
    memo(
        ReportActionItemCreated,
        (prevProps, nextProps) =>
            lodashGet(prevProps.props, 'policy.name') === lodashGet(nextProps, 'policy.name') &&
            lodashGet(prevProps.props, 'policy.avatar') === lodashGet(nextProps, 'policy.avatar') &&
            lodashGet(prevProps.props, 'report.lastReadTime') === lodashGet(nextProps, 'report.lastReadTime') &&
            lodashGet(prevProps.props, 'report.statusNum') === lodashGet(nextProps, 'report.statusNum') &&
            lodashGet(prevProps.props, 'report.stateNum') === lodashGet(nextProps, 'report.stateNum'),
    ),
);
