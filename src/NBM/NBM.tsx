import './NBM.css'
import AppConfig from '../config'
import BasemapContext from '../Contexts/BasemapContext'
import Control from 'react-leaflet-control'
import Dialog from 'react-dialog'
import InfoSign from '../InfoSign/InfoSign'
import L, {LatLngBoundsExpression, Layer} from 'leaflet'
import LocationOverlay from './LocationOverylays/LocationOverlay'
import React, {FunctionComponent, useState, useEffect, useRef, useContext} from 'react'
import TimeSlider from './TimeSlider/TimeSlider'
import loadingGif from './loading.gif'
import shp from 'shpjs'
import {EditControl} from 'react-leaflet-draw'
import {FaCloudUploadAlt} from 'react-icons/fa'
import {FaKey} from 'react-icons/fa'
import {isEmpty} from 'lodash'

// @ts-ignore
import {Map, TileLayer, WMSTileLayer, Marker, Popup, GeoJSON, FeatureGroup, ZoomControl} from 'react-leaflet'
import LegendContext from '../Contexts/LegendContext'

const DEV_MODE = AppConfig.REACT_APP_DEV


const ENV = AppConfig.REACT_APP_ENV
const BUFFER = .5

export interface INBMProps {
  // @Matt TODO: do we need this?
  className: string
  initPoint: null | {
    lat: number,
    lng: number
  },
  feature: any
  setMap: Function
  analysisLayers: any[]
  mapDisplayYear: number
  overlay: any
  clickDrivenEvent: any
  parentClickHandler: Function
  parentDrawHandler: Function
  applicationVersion: string
  bioscapeName: string
  priorityBap: any
}

const API_VERSION_URL = AppConfig.REACT_APP_BIS_API + '/api'

const NBM: FunctionComponent<INBMProps> = (props) => {

  const {setMap} = props

  const [basemap] = useContext(BasemapContext)
  const {toggleLegend, hasLegend} = useContext(LegendContext)

  const [point, setPoint] = useState(() => {
    if (!props.initPoint) return null
    return [props.initPoint?.lat, props.initPoint?.lng]
  })
  const [attributionOpen, setAttributionOpen] = useState(false)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  // @Matt TODO: do something with the uploading?
  const [uploadError, setUploadError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [oldOverlay, setOldOverlay] = useState<Layer>()
  const [bounds, setBounds] = useState<LatLngBoundsExpression>([[21, -134], [51, -63]])
  const [oldLayers, setOldLayers] = useState<any[]>([])
  const [APIVersion, setAPIVersion] = useState('')
  const [drawnpolygon, setDrawnpolygon] = useState<any>()

  const locationOverlay = useRef<LocationOverlay>(null)
  const map = useRef<Map>(null)

  // @Matt TODO: #next all things in functioncomponents can't do it this way
  let clickableRef = useRef(true)
  let layerError = false

  useEffect(() => {
    console.log('api version effect')
    fetch(API_VERSION_URL)
      .then((res) => res.json())
      .then((res) => setAPIVersion(res.Version))
      .catch(() => setAPIVersion('UNKNOWN'))
  }, [])

  useEffect(() => {
    console.log('bounds effect')
    if (isEmpty(props.feature)) {return }

    if (!props.feature.type) {
      props.feature.type = 'Feature'
    }
    let b = L.geoJSON(props.feature).getBounds()

    let northEastLng = b.getNorthEast().lng + BUFFER
    // zooms to features that cross 180 on the right side of map
    if (northEastLng > 179) {
      northEastLng = -50
    }

    const sw = b.getSouthWest()
    setBounds([
      [sw.lat - BUFFER, sw.lng - BUFFER],
      [b.getNorthEast().lat + BUFFER, northEastLng]
    ])
  }, [props.feature])

  useEffect(() => {
    console.log('setMap effect')
    // is a hack that others have suggested because react leaflet
    // does not support leaflet onLoad event.
    setTimeout(() => {
      if (!map.current) {return }
      map.current.leafletElement.invalidateSize()
      L.control.scale({metric: false, imperial: true, position: 'bottomleft'}).addTo(map.current.leafletElement)
      map.current.leafletElement.removeControl(map.current.leafletElement.attributionControl)
      L.control.attribution({position: 'topleft'}).addTo(map.current.leafletElement)
    }, ENV === 'Local' ? 1500 : 250)

    setMap(map)

    // @Matt TODO: need a better fix then ignore
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map])

  useEffect(() => {
    console.log('fitbounds effect')
    map?.current?.leafletElement.fitBounds(bounds)
  }, [bounds])

  useEffect(() => {
    console.log('layer adding/removing effect')
    const currentLayers = props.analysisLayers || []

    for (const oldItem of oldLayers) {
      map?.current?.leafletElement.removeLayer(oldItem.layer)
    }

    for (const newItem of currentLayers) {
      map?.current?.leafletElement.addLayer(newItem.layer)
      if (newItem.timeEnabled) {
        newItem.layer.setParams({
          time: `${props.mapDisplayYear}-01-01`
        })
      }
    }
    setOldLayers(currentLayers)
  }, [props.analysisLayers, props.mapDisplayYear, oldLayers])

  useEffect(() => {
    console.log('overlay effect')
    if (oldOverlay) {
      map?.current?.leafletElement.removeLayer(oldOverlay)
    }
    if (props.overlay) {
      setOldOverlay(props.overlay)
      map?.current?.leafletElement.addLayer(props.overlay)
    }
  }, [props.overlay, oldOverlay])

  useEffect(() => {
    console.log('feature effect')
    if (!isEmpty(props.feature) && !props.clickDrivenEvent) {
      const center = L.geoJSON(props.feature).getBounds().getCenter()
      setPoint([center.lat, center.lng])
      props.parentClickHandler({latlng: {lat: center.lat, lng: center.lng}}, true)
    }

    // @Matt TODO: need a better fix then ignore
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.feature])

  const handleClick = (e: any) => {
    if (!clickableRef.current) return

    setPoint([e.latlng.lat, e.latlng.lng])

    if (drawnpolygon) {
      map?.current?.leafletElement.removeLayer(drawnpolygon)
      setDrawnpolygon(null)
    }
    props.parentClickHandler(e)
  }

  const handleMouseMove = (e: any) => {
    if (!clickableRef.current) {
      locationOverlay?.current?.setLocation(null, null)
    }
    else {
      locationOverlay?.current?.setLocation(e.latlng.lat, e.latlng.lng)
    }
  }

  // @Matt TODO: #next user drawn polygons still load the single data point, need to disallow that

  const handleLoadError = (err: any) => {
    let prevErr = layerError
    layerError = true
    // sometimes reduces the bounce on a hard refresh.
    if (!prevErr && layerError) {
      // @Matt TODO: #next this toast isn't very performant, need to replace with a better version
      /* toast.notify( */
      /*   <div> */
      /*     <h4>Error loading layer <i>{e.target.options.layers}</i> from <br /> <br />{e.target._url}</h4> */
      /*   </div>, {duration: 15000, position: 'top'} */
      /* ) */
    }
  }

  const handleMouseOut = () => {
    locationOverlay?.current?.setLocation(null, null)
  }

  const disableDragging = () => {
    clickableRef.current = false
    if (map.current) {
      map.current.leafletElement.dragging.disable()
    }
  }

  const enableDragging = () => {
    clickableRef.current = true
    map?.current?.leafletElement.dragging.enable()
  }

  const userDrawnPolygonStop = (e: any) => {
    setDrawnpolygon(e.layer)
    let geom = e.layer.toGeoJSON().geometry
    geom.crs = {type: 'name', properties: {name: 'EPSG:4326'}}
    props.parentDrawHandler(geom)
  }

  const userDrawnPolygonStart = () => {
    setPoint(null)
    props.parentDrawHandler(null)
    if (drawnpolygon) {
      map?.current?.leafletElement.removeLayer(drawnpolygon)
      setDrawnpolygon(null)
    }
    disableDragging()
  }

  const uploadFile = (event: any) => {
    const file = event.target.files[0]
    if (file.size > 5000000) {
      setUploadError('File size is greater than 5MB')

      return
    }

    setUploading(true)

    try {
      const fileNameArr = file.name.split('.')
      const fileExt = fileNameArr[fileNameArr.length - 1]
      if (fileExt === 'zip') {
        parseShapefile(file)
      } else if (fileExt === 'geojson' || fileExt === 'json') {
        parseGeojsonFile(file)
      } else {
        setUploadError(`Uploads of files with the extension ${fileExt} are not supported.`)
        setUploading(false)
      }
    } catch (ex) {
      setUploadError('File read failure: ' + ex.message)
      setUploading(false)
    }
    event.target.value = '' // make sure the user can upload the same file again
  }

  const parseShapefile = (file: Blob) => {
    const fileReader = new FileReader()
    fileReader.onload = () => {
      shp(fileReader.result as string)
        .then((geojson: any) => {
          handleGeojson(geojson)
        })
        .catch((ex: any) => {
          setUploadError('Shapefile parse issue: ' + ex.message)
          setUploading(false)
        })
    }
    fileReader.readAsArrayBuffer(file)
  }

  const parseGeojsonFile = (file: Blob) => {
    const fileReader = new FileReader()
    fileReader.onload = (event) => {
      const result = event?.target?.result as string
      const geojson = JSON.parse(result)
      handleGeojson(geojson)
    }
    fileReader.readAsText(file)
  }

  const handleGeojson = (geojson: any) => {
    const geometry = geojson.type === 'FeatureCollection' ? geojson = geojson.features[0].geometry : geojson.geometry
    geometry.crs = {type: 'name', properties: {name: 'EPSG:4326'}}
    if (geometry.type !== 'Polygon' && geometry.type !== 'MultiPolygon') {
      setUploadError('Only Polygons are accepted for upload.')
      setUploading(false)
      return
    }
    handleClose()
    userDrawnPolygonStart()
    const layer = L.geoJSON(geojson)
    map?.current?.leafletElement.fitBounds(layer.getBounds())
    enableDragging()
    props.parentDrawHandler(geometry)
  }

  const handleShow = () => {
    setShowUploadDialog(true)
  }

  const handleClose = () => {
    setShowUploadDialog(false)
    setUploadError('')
    setUploading(false)
  }

  const geojson = () => {
    if (!isEmpty(props.feature)) {
      const key = props.feature.properties.feature_id
      return (
        <div>
          <GeoJSON style={{color: 'black', fill: false, weight: 4}} key={key + 'black'} data={props.feature} />
          <GeoJSON style={{color: 'red', fill: false, weight: 2}} key={key + 'red'} data={props.feature} />
        </div>
      )
    }
  }

  const renderBasemap = () => {
    if (basemap) {
      if (basemap.type === 'TileLayer') {
        return <TileLayer url={basemap.serviceUrl} attribution={basemap.attribution} />
      } else if (basemap.type === 'WMSTileLayer') {
        return (
          <WMSTileLayer
            url={basemap.serviceUrl}
            format={basemap.leafletProperties.format}
            layers={basemap.leafletProperties.layers}
            attribution={basemap.attribution}
          />
        )
      }
    }
  }

  const attribution = () => {

    if (!attributionOpen) return
    return (
      <Dialog
        className=""
        isResizable={true}
        isDraggable={true}
        title={'Attributions'}
        modal={false}
        onClose={() => setAttributionOpen(false)}
      >
        <div className="sbinfo-popout-window">
          <div>
            <div className="attrDiv">
              <strong>Mapping API: </strong>
              <a href="http://leafletjs.com" title="A JS library for interactive maps">{'Leaflet'}</a> powered by
              <a href="https://www.esri.com">Esri</a>.
            </div>
            <div className="attrDiv">
              <strong>Biogeography interface </strong>heavily influenced by: UW-Macrostrat project
              <a href="https://github.com/UW-Macrostrat/gmna-app" >on Github</a>.
            </div>
            <div className="attrDiv">
              <strong>NatureServe Species Data: </strong>Natureserve. 2008. NatureServe Web Service. Arlington, VA. U.S.A.  Available
              <a href="http://services.natureserve.org">http://services.natureserve.org</a>.
            </div>
            <div className="attrDiv">
              <strong>OpenStreetMap: </strong> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors
            </div>
            <hr />
            <div className="attrDiv">
              <div id="footer-text">
                <div>Contact Information: <a href="mailto:bcb@usgs.gov">bcb@usgs.gov</a></div>
                <div>Application Version:
                  <span id="frontEndVersion"> {props.applicationVersion}</span>
                </div>
                <div>API Version:
                  <span id="apiVersion"> {APIVersion}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Dialog>
    )
  }

  const uploadShapefileDialog = () => {
    if (showUploadDialog) {
      return (
        <Dialog
          title={'Upload a shapefile'}
          modal={true}
          onClose={handleClose}
        >
          <div className="sbinfo-popout-window">
            <ul>
              <li>Only shapefile (.shp) and GeoJSON (.json , .geojson) files under 5MB are accepted.</li>
              <li>Your shapefile must be zipped into a '.zip' extension and be under 5MB.</li>
              <li>Only the first <b>polygon</b> feature in your file will be used. Point and line geometries are not accepted.</li>
              <li>Valid .shp, .shx, .dbf, and .prj files must be included.</li>
              <li>Most common coordinate systems are supported.</li>
            </ul>
            {uploadError &&
              <div className="text-danger"><b>Error: </b>{uploadError}</div>
            }
            <label className="mb-0 pt-1 rounded float-right" title="Upload a shp file">
              <span className="btn submit-analysis-btn">Upload</span>
              <input type="file" name="file-upload" id="file-upload" accept=".zip, .shp, json, .geojson" style={{display: 'none'}}
                onChange={uploadFile} />
            </label>
            {uploading &&
              <img src={loadingGif} alt="Loading..."></img>
            }
          </div>
        </Dialog>
      )
    }
  }

  return (
    <>
      <Map ref={map}
        onClick={handleClick}
        bounds={bounds}
        onLayerAdd={(event: any) => {
          event.layer.on('tileerror', (err: any) => {
            handleLoadError(err)
          })
        }}
        onMouseMove={handleMouseMove}
        onMouseOut={handleMouseOut}
        attribution=""
        zoomControl={false} >
        {renderBasemap()}
        <LocationOverlay ref={locationOverlay} map={map} bioscapeName={props.bioscapeName} />
        <MapMarker point={point} />
        {geojson()}
        <div className="global-time-slider" onMouseOver={disableDragging} onMouseOut={enableDragging}>
          {props.bioscapeName !== 'terrestrial-ecosystems-2011' && <TimeSlider/>}
        </div>
        <div className="attribution" onClick={() => {setAttributionOpen(!attributionOpen)}} onMouseOver={disableDragging} onMouseOut={enableDragging}>
          <span className="attribution-info" style={{color: 'rgb(107, 153, 197)'}}>
            <InfoSign></InfoSign>
          </span>
        </div>
        <span onMouseOver={disableDragging} onMouseOut={enableDragging} >{attribution()}</span>
        <FeatureGroup>
          <ZoomControl position='topright'></ZoomControl>
          <EditControl
            position='topright'
            //onDeleted={() => { props.parentDrawHandler(null) }}
            onDrawStart={userDrawnPolygonStart}
            // onEditStart={disableDragging}
            // onEdited={userDrawnPolygon}
            //onEditStop={enableDragging}

            //onDeleteStart={userDrawnPolygonStart}
            onDrawStop={enableDragging}
            //onDeleteStop={enableDragging}
            onCreated={userDrawnPolygonStop}
            edit={{edit: false, remove: false}}
            draw={{
              rectangle: false,
              marker: false,
              circlemarker: false,
              polyline: false,
              circle: false
            }}
          />
          { hasLegend &&
            <Control position="topright">
              <div className="leaflet-bar" title="Legend">
                <button onClick={() => toggleLegend()}>
                  <FaKey />
                </button>
              </div>
            </Control>
          }
          {DEV_MODE &&
            <Control position="topright">
              <div className="leaflet-bar" title="Upload a shp file">
                <button onClick={handleShow}>
                  <FaCloudUploadAlt />
                </button>
              </div>
            </Control>
          }
        </FeatureGroup>
      </Map>
      {DEV_MODE && uploadShapefileDialog()}
    </>
  )
}

function MapMarker(props: any) {
  if (props.point) {
    return (
      <Marker position={props.point} name={'mapClickedMarker'}>
        <Popup>
          Area of Interest.
          </Popup>
      </Marker>
    )
  } else {
    return <div></div>
  }
}

export default NBM
