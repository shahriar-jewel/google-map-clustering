import React, { useState, useRef, useEffect } from "react";
import useSwr from "swr";
import GoogleMapReact from "google-map-react";
import useSupercluster from "use-supercluster";
import "./App.css";
import { getPlacesData } from "./data";

const fetcher = (...args) => fetch(...args).then(response => response.json());

const Marker = ({ children }) => children;

export default function App() {
  const mapRef = useRef();
  let rendered = useRef(false);
  const [bounds, setBounds] = useState(null);
  const [loading, setLoading] = useState(false);
  const [myData, setMyData] = useState([]);
  const [zoom, setZoom] = useState(10);

  useEffect(() => {
    rendered.current = true;
    setLoading(true);
    getPlacesData('restaurants', bounds?.sw, bounds?.ne).then((data) => {
      if(rendered.current){
        setMyData(data);
        setLoading(false);
      }
    });
    return () => {
      rendered.current = false;
    }
  },[bounds]);

  const crimes = myData ? myData : [];

  const points = crimes.map(crime => ({
    type: "Feature",
    properties: { cluster: false, crimeId: crime.location_id, category: crime?.category?.name },
    geometry: {
      type: "Point",
      coordinates: [
        parseFloat(crime.longitude),
        parseFloat(crime.latitude)
      ]
    }
  }));

  console.log(points);

  const { clusters, supercluster } = useSupercluster({
    points,
    bounds: [
      -1.2411810957931664,
      52.61208435908725,
      -1.0083656811012531,
      52.64495957533833
    ],
    zoom,
    options: { radius: 75, maxZoom: 20 }
  });

  console.log(clusters);

  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <GoogleMapReact
        bootstrapURLKeys={{ key: "AIzaSyCG1lV4BpW9zXTULbMG4At_Wd7xRdA106g" }}
        defaultCenter={{ lat: 52.6376, lng: -1.135171 }}
        defaultZoom={10}
        yesIWantToUseGoogleMapApiInternals
        onChildMouseEnter={(child) => {
          console.log(child);
      }}
        onGoogleApiLoaded={({ map }) => {
          mapRef.current = map;
        }}
        // onChange={({ zoom, bounds }) => {
        //   setZoom(zoom);
        //   setBounds([
        //     bounds.nw.lng,
        //     bounds.se.lat,
        //     bounds.se.lng,
        //     bounds.nw.lat
        //   ]);
        // }}
        onChange={(e) => {
          setZoom(e.zoom);
          setBounds({ ne: e.marginBounds.ne, sw: e.marginBounds.sw });
      }}
      >
        {clusters?.map(cluster => {
          const [longitude, latitude] = cluster.geometry.coordinates;
          const {
            cluster: isCluster,
            point_count: pointCount
          } = cluster.properties;

          if (isCluster) {
            return (
              <Marker
                key={`cluster-${cluster.id}`}
                lat={latitude}
                lng={longitude}
              >
                <div
                  className="cluster-marker"
                  style={{
                    width: `${10 + (pointCount / points.length) * 20}px`,
                    height: `${10 + (pointCount / points.length) * 20}px`
                  }}
                  onClick={() => {
                    const expansionZoom = Math.min(
                      supercluster.getClusterExpansionZoom(cluster.id),
                      20
                    );
                    mapRef.current.setZoom(expansionZoom);
                    mapRef.current.panTo({ lat: latitude, lng: longitude });
                  }}
                >
                  {pointCount}
                </div>
              </Marker>
            );
          }

          return (
            <Marker
              key={cluster.properties.crimeId}
              lat={latitude}
              lng={longitude}
            >
              <button className="crime-marker" onClick={()=> console.log(cluster.properties.crimeId)}>
                <img src="/custody.svg" alt="crime doesn't pay" />
              </button>
            </Marker>
          );
        })}
      </GoogleMapReact>
    </div>
  );
}
