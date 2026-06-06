import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Factory, Cog, Zap, Activity, Leaf, Gauge, BatteryCharging, PlayCircle, Wrench } from 'lucide-react';
import { KPICard } from '../components/dashboard/KPICard';
import { TelemetryChart } from '../components/dashboard/TelemetryChart';
import { GaugeChart } from '../components/dashboard/GaugeChart';
import { MetricCard } from '../components/dashboard/MetricCard';
import { useAuth } from '../hooks/useAuth';

export const PlantPage = () => {
  const { plantId } = useParams();
  const { role } = useAuth();
  const [powerRange, setPowerRange] = useState('7days');
  
  const [data, setData] = useState({
    name: 'Loading...',
    kpis: { units: 0, faults: 0, capacity: 0, runningUnits: 0, maintenanceUnits: 0 },
    powerData: [],
    dailyPowerData: [],
    efficiency: { plantEff: 0, auxPower: 0, capacityUtil: 0 },
    environmental: { waterData: [], coalData: [], co2Data: [], flyAshData: [] }
  });

  useEffect(() => {
    const generateTimeData = (base, varRange, unit) => {
      const now = new Date();
      return Array.from({ length: 12 }, (_, i) => {
        const time = new Date(now.getTime() - (11 - i) * 600000);
        return {
          time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          value: Math.floor(base + (Math.random() * varRange - varRange / 2)),
          unit
        };
      });
    };

    const generateDailyData = (base, varRange) => {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      return days.map((day) => ({
        time: day,
        value: Math.floor(base + (Math.random() * varRange - varRange / 2)),
        unit: 'MWh'
      }));
    };

    const fetchData = async () => {
      try {
        const { api } = await import('../services/api');
        let plantName = `Plant #${plantId}`;
        let unitsCount = 0, faultsCount = 0, capacityCount = 0;
        let runningUnits = 0, maintenanceUnits = 0;
        let dailyPower = [];
        let dailyWater = [];
        let dailyCoal = [];
        let dailyCo2 = [];
        let dailyFlyAsh = [];

        try {
          const plants = await api.get('/plants');
          const plant = plants.find(p => p.id.toString() === plantId);
          if (plant) {
            plantName = plant.name;
            unitsCount = plant.units;
            faultsCount = plant.faults;
            capacityCount = parseFloat(plant.capacity);
          }
        } catch (e) { console.error('Failed to fetch plant data', e); }

        try {
          const allUnits = await api.get('/units');
          const plantUnits = allUnits.filter(u => u.plantId.toString() === plantId);
          runningUnits = plantUnits.filter(u => u.status === 'running').length;
          maintenanceUnits = plantUnits.filter(u => u.status === 'under_maintenance').length;
          faultsCount = plantUnits.filter(u => u.status === 'faulty').length;
        } catch (e) {
          runningUnits = unitsCount - faultsCount;
          maintenanceUnits = 0;
        }

        let submissionsList = [];
        try {
          const submissions = await api.get(`/submissions?plant_id=${plantId}`);
          if (submissions && submissions.length > 0) {
            // Sort submissions chronologically by date
            submissions.sort((a, b) => new Date(a.date) - new Date(b.date));
            submissionsList = submissions;

            submissions.forEach(s => {
              const dateStr = s.date;
              const parts = dateStr.split('-');
              const label = `${parts[1]}-${parts[2]}`; // "MM-DD"
              
              dailyPower.push({ time: label, value: s.powerGenerated, unit: 'MWh', rawDate: s.date });
              dailyWater.push({ time: label, value: s.waterConsumption, unit: 'm³' });
              dailyCoal.push({ time: label, value: s.coalConsumption, unit: 't' });
              dailyCo2.push({ time: label, value: s.co2Emissions, unit: 't' });
              dailyFlyAsh.push({ time: label, value: s.flyAsh, unit: 't' });
            });

            // Append virtual placeholder next day
            const lastSub = submissions[submissions.length - 1];
            const lastDate = new Date(lastSub.date);
            const nextDate = new Date(lastDate.getTime() + 24 * 60 * 60 * 1000);
            const nextMonth = String(nextDate.getMonth() + 1).padStart(2, '0');
            const nextDay = String(nextDate.getDate()).padStart(2, '0');
            const nextLabel = `${nextMonth}-${nextDay}`;

            dailyPower.push({ time: nextLabel, value: lastSub.powerGenerated, unit: 'MWh', rawDate: `${nextDate.getFullYear()}-${nextMonth}-${nextDay}` });
            dailyWater.push({ time: nextLabel, value: lastSub.waterConsumption, unit: 'm³' });
            dailyCoal.push({ time: nextLabel, value: lastSub.coalConsumption, unit: 't' });
            dailyCo2.push({ time: nextLabel, value: lastSub.co2Emissions, unit: 't' });
            dailyFlyAsh.push({ time: nextLabel, value: lastSub.flyAsh, unit: 't' });
          }
        } catch (e) {
          console.error("Failed to fetch plant submissions", e);
        }

        const hasSubmissions = dailyPower.length > 0;
        const latestSubmission = hasSubmissions ? submissionsList[submissionsList.length - 1] : null;

        setData({
          name: plantName,
          kpis: { units: unitsCount, faults: faultsCount, capacity: capacityCount, runningUnits, maintenanceUnits },
          powerData: hasSubmissions && latestSubmission 
            ? generateTimeData(Math.round(latestSubmission.powerGenerated / 24), 30, 'MW') 
            : [],
          dailyPowerData: dailyPower,
          efficiency: {
            plantEff: (() => {
              if (!hasSubmissions || !submissionsList.length) return 0;
              const totalPower = submissionsList.reduce((sum, s) => sum + s.powerGenerated, 0);
              const totalCoal = submissionsList.reduce((sum, s) => sum + s.coalConsumption, 0);
              return totalCoal > 0 ? Math.min(50, (totalPower / (totalCoal * 8.14)) * 100 / submissionsList.length) : 0;
            })(),
            auxPower: hasSubmissions && latestSubmission ? latestSubmission.auxiliaryPower : 0,
            capacityUtil: (hasSubmissions && latestSubmission && capacityCount > 0)
              ? Math.min(100, ((latestSubmission.powerGenerated / 24) / capacityCount) * 100)
              : 0
          },
          environmental: {
            waterData: dailyWater,
            coalData: dailyCoal,
            co2Data: dailyCo2,
            flyAshData: dailyFlyAsh
          }
        });
      } catch (err) { console.error(err); }
    };

    fetchData();
  }, [plantId, role]);

  const filteredDailyPower = useMemo(() => {
    if (!data.dailyPowerData || data.dailyPowerData.length === 0) return [];
    if (powerRange === 'all') return data.dailyPowerData;
    
    const cutoffDate = new Date();
    if (powerRange === '7days') cutoffDate.setDate(cutoffDate.getDate() - 7);
    else if (powerRange === '30days') cutoffDate.setDate(cutoffDate.getDate() - 30);
    
    if (powerRange === 'lastMonth') {
       const now = new Date();
       const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
       const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
       return data.dailyPowerData.filter(d => {
           const dDate = new Date(d.rawDate);
           return dDate >= start && dDate <= end;
       });
    }
    
    return data.dailyPowerData.filter(d => new Date(d.rawDate) >= cutoffDate);
  }, [data.dailyPowerData, powerRange]);

  return (
    <div className="fade-in" style={{ paddingBottom: '40px' }}>
      <h2 style={{ marginBottom: '24px', fontWeight: 600, color: 'var(--text-primary)' }}>{data.name} — Dashboard</h2>
      
      {/* KPI Cards: 12-column grid, span 3 for each (approx 4 in a row, the 5th wraps or takes span 3) */}
      <div className="dashboard-grid" style={{ marginBottom: '32px' }}>
        <div className="col-span-3">
          <KPICard title="Total Units" value={data.kpis.units} icon={Cog} colorClass="border-blue" />
        </div>
        <div className="col-span-3">
          <KPICard title="Net Capacity" value={`${data.kpis.capacity} MW`} icon={Zap} colorClass="border-blue" />
        </div>
        <div className="col-span-3">
          <KPICard title="Running Units" value={data.kpis.runningUnits} icon={PlayCircle} colorClass="border-emerald" />
        </div>
        <div className="col-span-3">
          <KPICard title="Under Maintenance" value={data.kpis.maintenanceUnits} icon={Wrench} colorClass="border-amber" />
        </div>
        {/* Placed prominently if there's a fault */}
        <div className="col-span-4">
          <KPICard title="Faulty Units" value={data.kpis.faults} icon={Factory} colorClass={data.kpis.faults > 0 ? "border-red" : "border-emerald"} />
        </div>
      </div>

      <div className="dashboard-grid" style={{ marginBottom: '32px' }}>
        {/* Power Generation - Left 8 columns */}
        <div className="col-span-8">
          <div className="section-header" style={{ marginTop: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={18} className="section-icon text-blue" />
              <h3 style={{ margin: 0 }}>Power Generation</h3>
            </div>
            <select 
              value={powerRange} 
              onChange={e => setPowerRange(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border-glass)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none', cursor: 'pointer', fontSize: '0.9rem' }}
            >
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="lastMonth">Last Month</option>
              <option value="all">All Time</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <TelemetryChart title="Power Generated" data={filteredDailyPower} dataKey="value" strokeColor="var(--accent-primary)" fillColor="var(--accent-primary)" />
          </div>
        </div>

        {/* Efficiency Metrics - Right 4 columns */}
        <div className="col-span-4">
          <div className="section-header" style={{ marginTop: 0 }}>
            <Gauge size={18} className="section-icon text-emerald" />
            <h3>Efficiency Metrics</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <GaugeChart title="Plant Efficiency" value={data.efficiency.plantEff} maxValue={50} unit="%" color="var(--accent-emerald)" />
            <MetricCard title="Auxiliary Power" value={data.efficiency.auxPower} unit="MW" icon={BatteryCharging} color="var(--accent-amber)" />
            <GaugeChart title="Capacity Utilization" value={data.efficiency.capacityUtil} maxValue={100} unit="%" color="var(--accent-cyan)" />
          </div>
        </div>
      </div>

      {/* Environmental Monitoring */}
      <div className="section-header">
        <Leaf size={18} className="section-icon text-emerald" />
        <h3>Environmental Monitoring</h3>
      </div>
      <div className="dashboard-grid">
        <div className="col-span-6">
          <TelemetryChart title="Water Consumption" data={data.environmental.waterData} dataKey="value" strokeColor="var(--accent-cyan)" fillColor="var(--accent-cyan)" />
        </div>
        <div className="col-span-6">
          <TelemetryChart title="Coal Consumption" data={data.environmental.coalData} dataKey="value" strokeColor="var(--accent-amber)" fillColor="var(--accent-amber)" />
        </div>
        <div className="col-span-6">
          <TelemetryChart title="CO₂ Emissions" data={data.environmental.co2Data} dataKey="value" strokeColor="var(--accent-red)" fillColor="var(--accent-red)" />
        </div>
        <div className="col-span-6">
          <TelemetryChart title="Fly Ash Generated" data={data.environmental.flyAshData} dataKey="value" strokeColor="var(--accent-emerald)" fillColor="var(--accent-emerald)" />
        </div>
      </div>
    </div>
  );
};
