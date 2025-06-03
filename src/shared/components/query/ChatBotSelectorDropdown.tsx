import React from 'react';

import mainStyles from '../../../../packages/oncokb-frontend-commons/src/components/main.module.scss';
import collapsibleStyles from '../../../../packages/oncokb-frontend-commons/src/components/collapsible.module.scss';
import { Collapse } from 'react-collapse';
import classnames from 'classnames';

export type ChatBotSelectorDropdownProps = {
    collapsibleArea: JSX.Element;
    dropdownTitle: string;
};

export const ChatBotSelectorDropdown: React.FunctionComponent<ChatBotSelectorDropdownProps> = (
    props: ChatBotSelectorDropdownProps
) => {
    const [componentCollapsed, updateLevelCollapse] = React.useState(true);

    return (
        <div>
            <div
                data-test="chatboxselector-dropdown-header"
                className={collapsibleStyles['collapsible-header']}
                onClick={() => updateLevelCollapse(!componentCollapsed)}
            >
                {props.dropdownTitle}
                <span style={{ float: 'right' }}>
                    {componentCollapsed ? (
                        <i
                            className={classnames(
                                'fa fa-chevron-down',
                                mainStyles['blue-icon']
                            )}
                        />
                    ) : (
                        <i
                            className={classnames(
                                'fa fa-chevron-up',
                                mainStyles['blue-icon']
                            )}
                        />
                    )}
                </span>
            </div>
            <Collapse isOpened={!componentCollapsed}>
                {props.collapsibleArea}
            </Collapse>
        </div>
    );
};
