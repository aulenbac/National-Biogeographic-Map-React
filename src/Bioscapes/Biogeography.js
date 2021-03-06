import AppConfig from '../config'
// import BadNeighborAnalysis from '../AnalysisPackages/BadNeighborAnalysis'
import EcosystemProtectionAnalysis from '../AnalysisPackages/EcosystemProtectionAnalysis'
import ExpectedLandUseAnalysis from '../AnalysisPackages/ExpectedLandUseAnalysis'
import FirstBloomAnalysis from '../AnalysisPackages/FirstBloomAnalysis'
import FirstLeafAnalysis from '../AnalysisPackages/FirstLeafAnalysis'
import FirstLeafBloomComparisonAnalysis from '../AnalysisPackages/FirstLeafBloomComparisonAnalysis'
import NFHPAnalysis from '../AnalysisPackages/NFHPAnalysis'
import NVCSHierarchyByPixel from '../AnalysisPackages/NVCSHierarchyByPixel'
import NVCSSummaryByRegion from '../AnalysisPackages/NVCSSummaryByRegion'
import OBISAnalysis from '../AnalysisPackages/OBISAnalysis'
// import PhenologyAnalysis from '../AnalysisPackages/PhenologyAnalysis'
import React from 'react'
import SpeciesProtectionAnalysis from '../AnalysisPackages/SpeciesProtectionAnalysis'

const DEV_MODE = AppConfig.REACT_APP_DEV

class Biogeography extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            results: props.results,
            textSearchHandler: props.textSearchHandler,
            submitHandler: props.submitHandler,
            layersDropdownOpen: false,
            bioscape: props.bioscape,
            updateAnalysisLayers: props.updateAnalysisLayers,
            loading: false,
            enabledLayers: [],
            basemapTooltipOpen: false

        }
        this.submit = this.submit.bind(this)
        this.share = this.share.bind(this)
        this.report = this.report.bind(this)
        this.getDefaultPriorityBap = this.getDefaultPriorityBap.bind(this)
        this.loaderRef = React.createRef()
    }

    submit(e) {
        this.state.submitHandler(e)
    }

    share() {
        this.props.shareState()
    }

    report() {

        let charts = []

        const baps = [
            this.EcosystemProtectionAnalysis,
            this.SpeciesProtectionAnalysis,
            this.NVCSHierarchyByPixel,
            this.NVCSSummaryByRegion,
            this.FirstLeafAnalysis,
            this.FirstBloomAnalysis,
            this.FirstLeafBloomComparisonAnalysis,
            this.NFHPAnalysis,
            this.OBISAnalysis,
        ]
        if (DEV_MODE) {
            // baps.push(this.PhenologyAnalysis)
            // baps.push(this.BadNeighborAnalysis)
            baps.push(this.ExpectedLandUseAnalysis)
        }

        baps.forEach((b) => {
            const pr = b.print()
            if (pr) {
                charts.push(pr)
            }
        })


        return charts
    }


    // given any feature set the default priority bap
    getDefaultPriorityBap() {
        return ''     // update BCB-1103 "default to no baps open or priority" the folling logic might still be helpful in the future
        // if (this.props.feature) {
        //     if (this.props.feature.properties.feature_id.includes('OBIS_Areas')) {
        //         return 'bap8'
        //     }
        //     else {
        //         return 'bap1'
        //     }
        // }
        // else return ""
    }



    render() {
        return (
            <div>
                <div className="nbm-flex-row-no-padding">
                    <EcosystemProtectionAnalysis
                        onRef={ref => (this.EcosystemProtectionAnalysis = ref)}
                        updateAnalysisLayers={this.props.updateAnalysisLayers}
                        setPriorityBap={this.props.setPriorityBap}
                        feature={this.props.feature}
                        priorityBap={this.props.priorityBap}
                        bapId={'bap5'}
                        initBap={(this.props.initBaps || {})['bap5']}
                        getDefaultPriorityBap={this.getDefaultPriorityBap}
                        setBapState={this.props.setBapState}
                    />
                </div>
                <div className="nbm-flex-row-no-padding">
                    <SpeciesProtectionAnalysis
                        onRef={ref => (this.SpeciesProtectionAnalysis = ref)}
                        updateAnalysisLayers={this.props.updateAnalysisLayers}
                        setPriorityBap={this.props.setPriorityBap}
                        feature={this.props.feature}
                        priorityBap={this.props.priorityBap}
                        bapId={'bap6'}
                        initBap={(this.props.initBaps || {})['bap6']}
                        getDefaultPriorityBap={this.getDefaultPriorityBap} setBapState={this.props.setBapState}
                    />
                </div>
                <div className="nbm-flex-row-no-padding">
                    <NVCSHierarchyByPixel
                        onRef={ref => (this.NVCSHierarchyByPixel = ref)}
                        updateAnalysisLayers={this.props.updateAnalysisLayers}
                        setPriorityBap={this.props.setPriorityBap}
                        feature={this.props.feature}
                        priorityBap={this.props.priorityBap}
                        bapId={'bap11'}
                        initBap={(this.props.initBaps || {})['bap11']}
                        getDefaultPriorityBap={this.getDefaultPriorityBap}
                        setBapState={this.props.setBapState}
                        point={this.props.point}
                        overlay={this.props.overlay}
                    />
                </div>
                <div className="nbm-flex-row-no-padding">
                    <NVCSSummaryByRegion
                        onRef={ref => (this.NVCSSummaryByRegion = ref)}
                        updateAnalysisLayers={this.props.updateAnalysisLayers}
                        setPriorityBap={this.props.setPriorityBap}
                        feature={this.props.feature}
                        priorityBap={this.props.priorityBap}
                        bapId={'bap12'}
                        initBap={(this.props.initBaps || {})['bap12']}
                        getDefaultPriorityBap={this.getDefaultPriorityBap}
                        setBapState={this.props.setBapState}
                        overlay={this.props.overlay}
                    />
                </div>
                <div className="nbm-flex-row-no-padding">
                    <FirstLeafAnalysis
                        onRef={ref => (this.FirstLeafAnalysis = ref)}
                        updateAnalysisLayers={this.props.updateAnalysisLayers}
                        setPriorityBap={this.props.setPriorityBap}
                        feature={this.props.feature}
                        priorityBap={this.props.priorityBap}
                        bapId={'bap1'}
                        initBap={(this.props.initBaps || {})['bap1']}
                        getDefaultPriorityBap={this.getDefaultPriorityBap}
                        setBapState={this.props.setBapState}
                    />
                </div>
                <div className="nbm-flex-row-no-padding">
                    <FirstBloomAnalysis
                        onRef={ref => (this.FirstBloomAnalysis = ref)}
                        updateAnalysisLayers={this.props.updateAnalysisLayers}
                        setPriorityBap={this.props.setPriorityBap}
                        feature={this.props.feature}
                        priorityBap={this.props.priorityBap}
                        bapId={'bap2'}
                        initBap={(this.props.initBaps || {})['bap2']}
                        getDefaultPriorityBap={this.getDefaultPriorityBap}
                        setBapState={this.props.setBapState}
                    />
                </div>
                <div className="nbm-flex-row-no-padding">
                    <FirstLeafBloomComparisonAnalysis
                        onRef={ref => (this.FirstLeafBloomComparisonAnalysis = ref)}
                        updateAnalysisLayers={this.props.updateAnalysisLayers}
                        setPriorityBap={this.props.setPriorityBap}
                        feature={this.props.feature}
                        priorityBap={this.props.priorityBap}
                        bapId={'bap3'}
                        initBap={(this.props.initBaps || {})['bap3']}
                        getDefaultPriorityBap={this.getDefaultPriorityBap}
                        setBapState={this.props.setBapState}
                    />
                </div>
                <div className="nbm-flex-row-no-padding">
                    <NFHPAnalysis
                        onRef={ref => (this.NFHPAnalysis = ref)}
                        updateAnalysisLayers={this.props.updateAnalysisLayers}
                        setPriorityBap={this.props.setPriorityBap}
                        feature={this.props.feature}
                        priorityBap={this.props.priorityBap}
                        bapId={'bap4'}
                        initBap={(this.props.initBaps || {})['bap4']}
                        getDefaultPriorityBap={this.getDefaultPriorityBap}
                        setBapState={this.props.setBapState}
                    />
                </div>
                <div className="nbm-flex-row-no-padding">
                    <OBISAnalysis
                        onRef={ref => (this.OBISAnalysis = ref)}
                        updateAnalysisLayers={this.props.updateAnalysisLayers}
                        setPriorityBap={this.props.setPriorityBap}
                        feature={this.props.feature}
                        priorityBap={this.props.priorityBap}
                        bapId={'bap8'}
                        initBap={(this.props.initBaps || {})['bap8']}
                        getDefaultPriorityBap={this.getDefaultPriorityBap}
                        setBapState={this.props.setBapState}
                    />
                </div>
                {/* Per Steve A. request remove this from all environments BCB-1766 */}
                {/*
                { DEV_MODE && <div className="nbm-flex-row-no-padding">
                    <PhenologyAnalysis
                        onRef={ref => (this.PhenologyAnalysis = ref)}
                        updateAnalysisLayers={this.props.updateAnalysisLayers}
                        setPriorityBap={this.props.setPriorityBap}
                        feature={this.props.feature}
                        priorityBap={this.props.priorityBap}
                        bapId={'bap7'}
                        initBap={(this.props.initBaps || {})['bap7']}
                        getDefaultPriorityBap={this.getDefaultPriorityBap}
                        setBapState={this.props.setBapState}
                        devBap={true}
                    />
                </div> } */}
                {/* Per Steve A. request remove this from all environments BCB-1420 */}
                {/* { DEV_MODE && <div className="nbm-flex-row-no-padding">
                    <BadNeighborAnalysis
                        onRef={ref => (this.BadNeighborAnalysis = ref)}
                        updateAnalysisLayers={this.props.updateAnalysisLayers}
                        setPriorityBap={this.props.setPriorityBap}
                        feature={this.props.feature}
                        priorityBap={this.props.priorityBap}
                        bapId={'bap9'}
                        initBap={(this.props.initBaps || {})['bap9']}
                        getDefaultPriorityBap={this.getDefaultPriorityBap}
                        setBapState={this.props.setBapState}
                        devBap={true}
                    />
                </div> } */}
                { DEV_MODE && <div className="nbm-flex-row-no-padding">
                    <ExpectedLandUseAnalysis
                        onRef={ref => (this.ExpectedLandUseAnalysis = ref)}
                        updateAnalysisLayers={this.props.updateAnalysisLayers}
                        setPriorityBap={this.props.setPriorityBap}
                        yearMin={'2001'}
                        yearMax={'2061'}
                        feature={this.props.feature}
                        priorityBap={this.props.priorityBap}
                        bapId={'bap10'}
                        initBap={(this.props.initBaps || {})['bap10']}
                        getDefaultPriorityBap={this.getDefaultPriorityBap}
                        setBapState={this.props.setBapState}
                        devBap={true}
                    />
                </div> }
            </div>
        )
    }
}
export default Biogeography
