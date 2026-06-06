import React, { useState, useEffect } from 'react';
import { Factory, Cog, Zap, Activity, Leaf, Gauge, BatteryCharging, PlayCircle, Wrench } from 'lucide-react';
import { KPICard } from '../components/dashboard/KPICard';
import { TelemetryChart } from '../components/dashboard/TelemetryChart';
import { GaugeChart } from '../components/dashboard/GaugeChart';
import { MetricCard } from '../components/dashboard/MetricCard';
import { useAuth } from '../hooks/useAuth';

export const HomePage = () => {
  const { role } = useAuth();
  const [data, setData] = useState({
    kpis: { plants: 0, units: 0, faults: 0, capacity: 0, runningUnits: 0, maintenanceUnits: 0 },
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
        let plantsCount = 0, unitsCount = 0, faultsCount = 0, capacityCount = 0;
        let runningUnits = 0, maintenanceUnits = 0;

        try {
          const plants = await api.get('/plants');
          plants.forEach(p => {
            plantsCount += 1;
            unitsCount += p.units;
            faultsCount += p.faults;
            capacityCount += parseFloat(p.capacity);
          });
        } catch (e) { console.error('Failed to fetch plants', e); }

        // Fetch actual unit statuses
        try {
          const units = await api.get('/units');
          runningUnits = units.filter(u => u.status === 'running').length;
          maintenanceUnits = units.filter(u => u.status === 'under_maintenance').length;
          faultsCount = units.filter(u => u.status === 'faulty').length;
        } catch (e) {
          runningUnits = unitsCount - faultsCount;
          maintenanceUnits = 0;
        }

        // Fetch stats submissions
        let dailyPower = [];
        let dailyWater = [];
        let dailyCoal = [];
        let dailyCo2 = [];
        let dailyFlyAsh = [];
        let allSubmissions = [];

        try {
          const submissions = await api.get('/submissions');
          if (submissions && submissions.length > 0) {
            // Sort submissions chronologically by date
            submissions.sort((a, b) => new Date(a.date) - new Date(b.date));
            allSubmissions = submissions;

            const grouped = {};
            submissions.forEach(s => {
              const dateStr = s.date;
              const parts = dateStr.split('-');
              const label = `${parts[1]}-${parts[2]}`; // "MM-DD"
              
              if (!grouped[label]) {
                grouped[label] = { power: 0, water: 0, coal: 0, co2: 0, flyAsh: 0, rawDate: s.date };
              }
              grouped[label].power += s.powerGenerated;
              grouped[label].water += s.waterConsumption;
              grouped[label].coal += s.coalConsumption;
              grouped[label].co2 += s.co2Emissions;
              grouped[label].flyAsh += s.flyAsh;
            });

            const sortedLabels = Object.keys(grouped).sort((a, b) => {
              return new Date(grouped[a].rawDate) - new Date(grouped[b].rawDate);
            });

            // Append virtual placeholder next day
            if (sortedLabels.length > 0) {
              const lastLabel = sortedLabels[sortedLabels.length - 1];
              const lastGroup = grouped[lastLabel];
              const lastRawDate = lastGroup.rawDate; // e.g. "2026-06-06"
              
              const nextDate = new Date(lastRawDate);
              nextDate.setDate(nextDate.getDate() + 1);
              const nextMonth = String(nextDate.getMonth() + 1).padStart(2, '0');
              const nextDay = String(nextDate.getDate()).padStart(2, '0');
              const nextLabel = `${nextMonth}-${nextDay}`;
              
              sortedLabels.push(nextLabel);
              grouped[nextLabel] = {
                power: lastGroup.power,
                water: lastGroup.water,
                coal: lastGroup.coal,
                co2: lastGroup.co2,
                flyAsh: lastGroup.flyAsh,
                rawDate: `${nextDate.getFullYear()}-${nextMonth}-${nextDay}`
              };
            }

            dailyPower = sortedLabels.map(label => ({ time: label, value: grouped[label].power, unit: 'MWh' }));
            dailyWater = sortedLabels.map(label => ({ time: label, value: grouped[label].water, unit: 'm³' }));
            dailyCoal = sortedLabels.map(label => ({ time: label, value: grouped[label].coal, unit: 't' }));
            dailyCo2 = sortedLabels.map(label => ({ time: label, value: grouped[label].co2, unit: 't' }));
            dailyFlyAsh = sortedLabels.map(label => ({ time: label, value: grouped[label].flyAsh, unit: 't' }));
          }
        } catch (e) {
          console.error("Failed to fetch submissions", e);
        }
        const hasSubmissions = dailyPower.length > 0;

        // Calculate efficiency metrics from real submission data
        let plantEff = 0, latestAuxPower = 0, capacityUtilization = 0;
        if (hasSubmissions && allSubmissions.length > 0) {
          const latest = allSubmissions[allSubmissions.length - 1];
          // Plant Efficiency: (power generated / (coal consumption × energy factor)) × 100
          // Standard thermal: ~8.14 MWh per tonne of coal
          const totalPower = allSubmissions.reduce((sum, s) => sum + s.powerGenerated, 0);
          const totalCoal = allSubmissions.reduce((sum, s) => sum + s.coalConsumption, 0);
          plantEff = totalCoal > 0 ? Math.min(50, (totalPower / (totalCoal * 8.14)) * 100 / allSubmissions.length) : 0;
          
          // Auxiliary Power: from latest submission
          latestAuxPower = latest.auxiliaryPower;
          
          // Capacity Utilization: (latest power / 24h) / total nameplate capacity × 100
          if (capacityCount > 0) {
            capacityUtilization = Math.min(100, ((latest.powerGenerated / 24) / capacityCount) * 100);
          }
        }

        setData({
          kpis: { plants: plantsCount, units: unitsCount, faults: faultsCount, capacity: capacityCount, runningUnits, maintenanceUnits },
          powerData: (() => {
            if (!hasSubmissions || !allSubmissions.length) return [];
            // Sum latest day's power across all plants to get total MW
            const latestDate = allSubmissions[allSubmissions.length - 1].date;
            const latestDaySubs = allSubmissions.filter(s => s.date === latestDate);
            const totalDayPower = latestDaySubs.reduce((sum, s) => sum + s.powerGenerated, 0);
            return generateTimeData(Math.round(totalDayPower / 24), 50, 'MW');
          })(),
          dailyPowerData: dailyPower,
          efficiency: {
            plantEff,
            auxPower: latestAuxPower,
            capacityUtil: capacityUtilization
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
  }, [role]);

  return (
    <div className="fade-in" style={{ paddingBottom: '40px' }}>
      <h2 style={{ marginBottom: '24px', fontWeight: 500 }}>Global Overview Dashboard</h2>
      
      {/* KPI Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <KPICard title="Total Plants" value={data.kpis.plants} icon={Factory} colorClass="border-crimson" />
        <KPICard title="Total Units" value={data.kpis.units} icon={Cog} colorClass="border-crimson" />
        <KPICard title="Net Capacity" value={`${data.kpis.capacity} MW`} icon={Zap} colorClass="border-amber" />
        <KPICard title="Running Units" value={data.kpis.runningUnits} icon={PlayCircle} colorClass="border-emerald" />
        <KPICard title="Under Maintenance" value={data.kpis.maintenanceUnits} icon={Wrench} colorClass="border-amber" />
        <KPICard title="Active Faults" value={data.kpis.faults} icon={Activity} colorClass={data.kpis.faults > 0 ? "border-red" : "border-emerald"} />
      </div>

      {/* Power Generation Section */}
      <div className="section-header">
        <Zap size={18} className="section-icon text-crimson" />
        <h3>Power Generation</h3>
      </div>
      <div className="metric-grid-2">
        <TelemetryChart 
          title="Net Power Output (Real-Time)" 
          data={data.powerData} 
          dataKey="value" 
          strokeColor="var(--accent-primary)" 
          fillColor="var(--accent-primary)" 
        />
        <TelemetryChart 
          title="Power Generated Per Day" 
          data={data.dailyPowerData} 
          dataKey="value" 
          strokeColor="var(--accent-amber)" 
          fillColor="var(--accent-amber)" 
        />
      </div>

      {/* Efficiency Metrics Section */}
      <div className="section-header">
        <Gauge size={18} className="section-icon text-emerald" />
        <h3>Efficiency Metrics</h3>
      </div>
      <div className="metric-grid">
        <GaugeChart 
          title="Plant Efficiency" 
          value={data.efficiency.plantEff} 
          maxValue={50} 
          unit="%" 
          color="var(--accent-emerald)" 
        />
        <MetricCard 
          title="Auxiliary Power Consumption" 
          value={data.efficiency.auxPower} 
          unit="MW" 
          icon={BatteryCharging} 
          color="var(--accent-amber)" 
        />
        <GaugeChart 
          title="Capacity Utilization" 
          value={data.efficiency.capacityUtil} 
          maxValue={100} 
          unit="%" 
          color="var(--accent-cyan)" 
        />
      </div>

      {/* Environmental Monitoring Section */}
      <div className="section-header">
        <Leaf size={18} className="section-icon text-emerald" />
        <h3>Environmental Monitoring</h3>
      </div>
      <div className="metric-grid-2">
        <TelemetryChart 
          title="Water Consumption" 
          data={data.environmental.waterData} 
          dataKey="value" 
          strokeColor="var(--accent-cyan)" 
          fillColor="var(--accent-cyan)" 
        />
        <TelemetryChart 
          title="Coal Consumption" 
          data={data.environmental.coalData} 
          dataKey="value" 
          strokeColor="var(--accent-amber)" 
          fillColor="var(--accent-amber)" 
        />
      </div>
      <div className="metric-grid-2" style={{ marginTop: '20px' }}>
        <TelemetryChart 
          title="CO₂ Emissions" 
          data={data.environmental.co2Data} 
          dataKey="value" 
          strokeColor="var(--accent-red)" 
          fillColor="var(--accent-red)" 
        />
        <TelemetryChart 
          title="Fly Ash Generated" 
          data={data.environmental.flyAshData} 
          dataKey="value" 
          strokeColor="var(--text-secondary)" 
          fillColor="var(--text-secondary)" 
        />
      </div>
    </div>
  );
};
