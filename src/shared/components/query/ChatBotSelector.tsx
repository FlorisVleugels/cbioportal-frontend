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
        if (queryStr !== this.store.aiQuery) {
            this.store.aiQuery = queryStr;
        }
    }

    handleSubmit() {
        this.store.geneQuery = this.store.aiQuery;

        await async;
    }

    render() {
        return (
            <FlexCol>
                <FlexRow>
                    <OQLTextArea
                        focus={this.store.geneQueryErrorDisplayStatus}
                        inputGeneQuery={this.store.aiQuery}
                        validateInputGeneQuery={false}
                        location={GeneBoxType.DEFAULT}
                        textBoxPrompt={
                            'Enter your desired query in natural language'
                        }
                        callback={this.handleOQLUpdate}
                        // error={this.store.submitError}
                        messages={this.store.oqlMessages}
                    ></OQLTextArea>
                    <FlexCol>
                        <button
                            style={{
                                paddingLeft: 10,
                                paddingRight: 10,
                                marginLeft: 10,
                            }}
                            disabled={this.store.generateQueryEnabled}
                            className="btn btn-primary btn-lg"
                            onClick={() => this.handleSubmit()}
                            data-test="generateButton"
                        >
                            Generate Query
                        </button>
                    </FlexCol>
                </FlexRow>
                <SectionHeader
                    className="sectionLabel"
                    secondaryComponent={
                        <a target="_blank" href={getOncoQueryDocUrl()}>
                            <strong>Hint:</strong> See some example queries here{' '}
                            <i className={'fa fa-external-link'} />
                        </a>
                    }
                ></SectionHeader>
            </FlexCol>
        );
    }
}
