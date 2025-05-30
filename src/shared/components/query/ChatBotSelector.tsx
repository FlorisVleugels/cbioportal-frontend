import * as React from 'react';
import styles from './styles/styles.module.scss';
import { Modal } from 'react-bootstrap';
import ReactSelect from 'react-select1';
import { observer } from 'mobx-react';
import { computed, action, makeObservable } from 'mobx';
import { FlexRow, FlexCol } from '../flexbox/FlexBox';
import gene_lists from './gene_lists';
import classNames from 'classnames';
import { getOncoQueryDocUrl } from '../../api/urls';
import { QueryStoreComponent, Focus, GeneReplacement } from './QueryStore';
import MutSigGeneSelector from './MutSigGeneSelector';
import GisticGeneSelector from './GisticGeneSelector';
import SectionHeader from '../sectionHeader/SectionHeader';
import { getServerConfig } from 'config/config';
import { ServerConfigHelpers } from '../../../config/config';
import OQLTextArea, { GeneBoxType } from '../GeneSelectionBox/OQLTextArea';
import { SingleGeneQuery } from 'shared/lib/oql/oql-parser';
import { Gene } from 'cbioportal-ts-api-client';
import FontAwesome from 'react-fontawesome';

@observer
export default class ChatBotSelector extends QueryStoreComponent<{}, {}> {
    constructor(props: any) {
        super(props);
        makeObservable(this);
    }

    @action.bound
    handleOQLUpdate(
        oql: {
            query: SingleGeneQuery[];
            error?: { start: number; end: number; message: string };
        },
        genes: { found: Gene[]; suggestions: GeneReplacement[] },
        queryStr: string
    ): void {
        if (queryStr !== this.store.geneQuery) {
            this.store.geneQuery = queryStr;
            this.store.oql.error = oql.error;
        }
    }

    render() {
        return (
            <FlexRow overflow padded className={styles.GeneSetSelector}>
                <SectionHeader className="sectionLabel">
                    Ask le Chatgippity:
                </SectionHeader>

                <FlexCol overflow>
                    <OQLTextArea
                        focus={this.store.geneQueryErrorDisplayStatus}
                        inputGeneQuery={this.store.geneQuery}
                        validateInputGeneQuery={false}
                        location={GeneBoxType.DEFAULT}
                        textBoxPrompt={
                            'Enter your desired query in natural language'
                        }
                        callback={this.handleOQLUpdate}
                        // error={this.store.submitError}
                        messages={this.store.oqlMessages}
                    ></OQLTextArea>
                </FlexCol>
            </FlexRow>
        );
    }
}
