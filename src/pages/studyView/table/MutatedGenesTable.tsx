import * as React from "react";
import {MutatedGenesData} from "pages/studyView/StudyViewPageStore";
import {default as LazyMobXTable} from "shared/components/lazyMobXTable/LazyMobXTable";
import {observer} from "mobx-react";
import {computed} from "mobx";
import styles from "./tables.module.scss";
import {MutationCountByGene} from "shared/api/generated/CBioPortalAPIInternal";
import LabeledCheckbox from "../../../shared/components/labeledCheckbox/LabeledCheckbox";
import MobxPromise from "mobxpromise";
import {If} from 'react-if';
import {StudyViewComponentLoader} from "../charts/StudyViewComponentLoader";

export interface IMutatedGenesTablePros {
    promise: MobxPromise<MutatedGenesData>;
    filters: number[];
    toggleSelection: (value: number) => void;
    numOfSelectedSamples: number;
}

class MutatedGenesTableComponent extends LazyMobXTable<MutationCountByGene> {
}

@observer
export class MutatedGenesTable extends React.Component<IMutatedGenesTablePros, {}> {
    public render() {
        return (
            <div className={styles.studyViewTablesTable}>
                <div className={styles.studyViewTablesTitle}>Mutated Genes</div>
                <div className={styles.studyViewTablesBody}>
                    <StudyViewComponentLoader promise={this.props.promise}>
                        <MutatedGenesTableComponent
                            initialItemsPerPage={10}
                            showCopyDownload={false}
                            data={this.props.promise.result}
                            columns={
                                [
                                    {
                                        name: 'Gene',
                                        render: (data: MutationCountByGene) => <span>{data.hugoGeneSymbol}</span>
                                    },
                                    {
                                        name: '# Mut',
                                        render: (data: MutationCountByGene) => <span>{data.totalCount}</span>
                                    },
                                    {
                                        name: '#',
                                        render: (data: MutationCountByGene) =>
                                            <LabeledCheckbox
                                                checked={this.props.filters.indexOf(data.entrezGeneId) !== -1}
                                                onChange={event => this.props.toggleSelection(data.entrezGeneId)}
                                            >
                                                {data.countByEntity}
                                            </LabeledCheckbox>
                                    },
                                    {
                                        name: 'Freq',
                                        render: (data: MutationCountByGene) => <span>{data.frequency + '%'}</span>
                                    }
                                ]
                            }
                        />
                    </StudyViewComponentLoader>
                </div>
            </div>
        );
    }
}
