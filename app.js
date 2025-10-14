// Global State
let workData = {
    weeklyTarget: 40,
    numDays: 5,
    dailyHours: [],
    constraints: [],
    preferences: {
        earliestStart: '07:00',
        latestEnd: '19:00',
        idealStart: '09:00',
        idealEnd: '17:00'
    }
};

const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    initializeNavigation();
    loadFromStorage();
    initializeScheduleInputs();
    updateDashboard();
    
    // Event Listeners
    document.getElementById('weeklyTarget').addEventListener('change', handleTargetChange);
    document.getElementById('numDays').addEventListener('change', handleDaysChange);
    document.getElementById('earliestStart').addEventListener('change', savePreferences);
    document.getElementById('latestEnd').addEventListener('change', savePreferences);
    document.getElementById('idealStart').addEventListener('change', savePreferences);
    document.getElementById('idealEnd').addEventListener('change', savePreferences);
});

// Navigation
function initializeNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const section = this.dataset.section;
            navigateTo(section);
        });
    });
}

function navigateTo(section) {
    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.section === section) {
            item.classList.add('active');
        }
    });
    
    // Update content sections
    document.querySelectorAll('.content-section').forEach(sec => {
        sec.classList.remove('active');
    });
    document.getElementById(section).classList.add('active');
}

// Storage Functions
function saveToStorage() {
    // Note: In production, use localStorage or IndexedDB
    // For now, keeping in memory
}

function loadFromStorage() {
    // Load preferences
    document.getElementById('weeklyTarget').value = workData.weeklyTarget;
    document.getElementById('numDays').value = workData.numDays;
    document.getElementById('earliestStart').value = workData.preferences.earliestStart;
    document.getElementById('latestEnd').value = workData.preferences.latestEnd;
    document.getElementById('idealStart').value = workData.preferences.idealStart;
    document.getElementById('idealEnd').value = workData.preferences.idealEnd;
}

// Schedule Inputs
function initializeScheduleInputs() {
    const container = document.getElementById('dailyHoursContainer');
    container.innerHTML = '';
    
    const numDays = parseInt(document.getElementById('numDays').value);
    workData.numDays = numDays;
    
    // Initialize daily hours array
    while (workData.dailyHours.length < numDays) {
        workData.dailyHours.push({ day: '', start: '', end: '', hours: 0 });
    }
    workData.dailyHours = workData.dailyHours.slice(0, numDays);
    
    for (let i = 0; i < numDays; i++) {
        const dayData = workData.dailyHours[i];
        const dayCard = document.createElement('div');
        dayCard.className = 'day-card';
        dayCard.id = `day-${i}`;
        
        dayCard.innerHTML = `
            <div class="day-header">
                <span class="day-name">${dayNames[i]}</span>
                <span class="day-total" id="total-${i}">0.0 hrs</span>
            </div>
            <div class="day-inputs">
                <div class="form-group">
                    <label>Start Time</label>
                    <input type="time" id="start-${i}" value="${dayData.start}" onchange="calculateDayHours(${i})">
                </div>
                <div class="form-group">
                    <label>End Time</label>
                    <input type="time" id="end-${i}" value="${dayData.end}" onchange="calculateDayHours(${i})">
                </div>
            </div>
        `;
        
        container.appendChild(dayCard);
    }
}

function calculateDayHours(dayIndex) {
    const startInput = document.getElementById(`start-${dayIndex}`);
    const endInput = document.getElementById(`end-${dayIndex}`);
    const totalDisplay = document.getElementById(`total-${dayIndex}`);
    const dayCard = document.getElementById(`day-${dayIndex}`);
    
    const start = startInput.value;
    const end = endInput.value;
    
    if (start && end) {
        const hours = calculateHoursBetween(start, end);
        workData.dailyHours[dayIndex] = {
            day: dayNames[dayIndex],
            start: start,
            end: end,
            hours: hours
        };
        
        totalDisplay.textContent = `${hours.toFixed(1)} hrs`;
        
        if (hours > 0) {
            dayCard.classList.add('completed');
        } else {
            dayCard.classList.remove('completed');
        }
    } else {
        workData.dailyHours[dayIndex].hours = 0;
        totalDisplay.textContent = '0.0 hrs';
        dayCard.classList.remove('completed');
    }
    
    updateDashboard();
    saveToStorage();
}

function calculateHoursBetween(startTime, endTime) {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    let hours = endHour - startHour;
    let minutes = endMin - startMin;
    
    if (minutes < 0) {
        hours -= 1;
        minutes += 60;
    }
    
    // Handle overnight shifts
    if (hours < 0) {
        hours += 24;
    }
    
    return hours + (minutes / 60);
}

function clearAllHours() {
    if (confirm('Clear all logged hours?')) {
        workData.dailyHours.forEach((day, i) => {
            document.getElementById(`start-${i}`).value = '';
            document.getElementById(`end-${i}`).value = '';
            calculateDayHours(i);
        });
    }
}

// Dashboard Updates
function updateDashboard() {
    const totalWorked = workData.dailyHours.reduce((sum, day) => sum + day.hours, 0);
    const target = parseFloat(document.getElementById('weeklyTarget').value) || 40;
    const remaining = target - totalWorked;
    const progress = (totalWorked / target) * 100;
    
    document.getElementById('totalWorked').textContent = totalWorked.toFixed(1);
    document.getElementById('targetHours').textContent = target.toFixed(1);
    document.getElementById('remainingHours').textContent = remaining.toFixed(1);
    document.getElementById('progressPercent').textContent = Math.min(progress, 100).toFixed(0) + '%';
    document.getElementById('progressBar').style.width = Math.min(progress, 100) + '%';
    
    updateWeeklyChart();
}

function updateWeeklyChart() {
    const chart = document.getElementById('weeklyChart');
    const maxHours = 12; // Max hours for chart scale
    
    let html = '';
    workData.dailyHours.forEach((day, i) => {
        const percentage = (day.hours / maxHours) * 100;
        html += `
            <div class="chart-bar">
                <div class="chart-label">${dayNames[i]}</div>
                <div class="chart-bar-bg">
                    <div class="chart-bar-fill" style="width: ${Math.min(percentage, 100)}%">
                        ${day.hours > 0 ? day.hours.toFixed(1) + 'h' : ''}
                    </div>
                </div>
            </div>
        `;
    });
    
    chart.innerHTML = html;
}

// Handle Input Changes
function handleTargetChange() {
    workData.weeklyTarget = parseFloat(this.value) || 40;
    updateDashboard();
    saveToStorage();
}

function handleDaysChange() {
    initializeScheduleInputs();
    updateDashboard();
    saveToStorage();
}

function savePreferences() {
    workData.preferences.earliestStart = document.getElementById('earliestStart').value;
    workData.preferences.latestEnd = document.getElementById('latestEnd').value;
    workData.preferences.idealStart = document.getElementById('idealStart').value;
    workData.preferences.idealEnd = document.getElementById('idealEnd').value;
    saveToStorage();
}

// Constraints Management
function addConstraint() {
    const container = document.getElementById('constraintsContainer');
    
    // Remove empty state if present
    const emptyState = container.querySelector('.empty-state');
    if (emptyState) {
        emptyState.remove();
    }
    
    const constraintId = Date.now();
    const constraintDiv = document.createElement('div');
    constraintDiv.className = 'constraint-item';
    constraintDiv.id = `constraint-${constraintId}`;
    
    constraintDiv.innerHTML = `
        <div class="constraint-content">
            <select class="form-control" id="constraint-day-${constraintId}">
                ${dayNames.slice(0, workData.numDays).map((day, i) => 
                    `<option value="${i}">${day}</option>`
                ).join('')}
            </select>
            <select class="form-control" id="constraint-type-${constraintId}">
                <option value="mustLeaveBy">Must leave by</option>
                <option value="mustStartAfter">Must start after</option>
                <option value="maxHours">Max hours</option>
            </select>
            <input type="time" class="form-control" id="constraint-value-${constraintId}">
        </div>
        <button class="constraint-remove" onclick="removeConstraint(${constraintId})">Remove</button>
    `;
    
    container.appendChild(constraintDiv);
    
    // Add to workData
    workData.constraints.push({
        id: constraintId,
        day: 0,
        type: 'mustLeaveBy',
        value: '17:00'
    });
    
    // Add event listeners
    document.getElementById(`constraint-day-${constraintId}`).addEventListener('change', function() {
        updateConstraint(constraintId, 'day', parseInt(this.value));
    });
    
    document.getElementById(`constraint-type-${constraintId}`).addEventListener('change', function() {
        updateConstraint(constraintId, 'type', this.value);
        updateConstraintInputType(constraintId, this.value);
    });
    
    document.getElementById(`constraint-value-${constraintId}`).addEventListener('change', function() {
        updateConstraint(constraintId, 'value', this.value);
    });
    
    saveToStorage();
}

function updateConstraintInputType(constraintId, type) {
    const input = document.getElementById(`constraint-value-${constraintId}`);
    if (type === 'maxHours') {
        input.type = 'number';
        input.min = '0';
        input.max = '24';
        input.step = '0.5';
        input.value = '8';
    } else {
        input.type = 'time';
        input.value = '17:00';
    }
}

function updateConstraint(constraintId, field, value) {
    const constraint = workData.constraints.find(c => c.id === constraintId);
    if (constraint) {
        constraint[field] = value;
        saveToStorage();
    }
}

function removeConstraint(constraintId) {
    const constraintDiv = document.getElementById(`constraint-${constraintId}`);
    constraintDiv.remove();
    
    workData.constraints = workData.constraints.filter(c => c.id !== constraintId);
    
    // Check if container is empty
    const container = document.getElementById('constraintsContainer');
    if (container.children.length === 0) {
        container.innerHTML = '<p class="empty-state">No constraints added. Click "+ Add Constraint" to add one.</p>';
    }
    
    saveToStorage();
}

// Calculate and Generate Suggestions
function calculateAndShow() {
    const totalWorked = workData.dailyHours.reduce((sum, day) => sum + day.hours, 0);
    const target = parseFloat(document.getElementById('weeklyTarget').value) || 40;
    const remaining = target - totalWorked;
    
    const unworkedDays = workData.dailyHours.filter(day => day.hours === 0);
    const workedDays = workData.dailyHours.filter(day => day.hours > 0);
    
    generateInsights(totalWorked, target, remaining, unworkedDays, workedDays);
    navigateTo('insights');
}

function generateInsights(totalWorked, target, remaining, unworkedDays, workedDays) {
    const container = document.getElementById('suggestionsContainer');
    container.innerHTML = '';
    
    const suggestions = [];
    
    // Overall Status
    if (remaining <= 0) {
        suggestions.push({
            type: 'success',
            icon: '🎉',
            title: 'Target Achieved!',
            body: `Congratulations! You've completed your ${target} hour target. You've worked ${totalWorked.toFixed(1)} hours total${remaining < 0 ? `, which is ${Math.abs(remaining).toFixed(1)} hours over your target` : ''}.`
        });
        
        if (remaining < -2) {
            suggestions.push({
                type: 'info',
                icon: '⚖️',
                title: 'Work-Life Balance',
                body: `You've worked ${Math.abs(remaining).toFixed(1)} extra hours. Consider taking time off or adjusting next week's schedule for better balance.`
            });
        }
    } else {
        // Calculate suggestions for remaining days
        if (unworkedDays.length === 0) {
            suggestions.push({
                type: 'warning',
                icon: '⚠️',
                title: 'No Remaining Days',
                body: `You still need ${remaining.toFixed(1)} hours but have logged all ${workData.numDays} days. You may need to adjust your existing schedule or plan overtime.`
            });
        } else {
            const avgHoursNeeded = remaining / unworkedDays.length;
            
            suggestions.push({
                type: 'info',
                icon: '📊',
                title: 'Hours Breakdown',
                body: `You've worked ${totalWorked.toFixed(1)} of ${target} hours (${((totalWorked/target)*100).toFixed(0)}%). You need ${remaining.toFixed(1)} more hours across ${unworkedDays.length} remaining day${unworkedDays.length > 1 ? 's' : ''}.`
            });
            
            // Generate schedule suggestions based on preferences and constraints
            const scheduleSuggestion = generateOptimalSchedule(remaining, unworkedDays);
            
            suggestions.push({
                type: avgHoursNeeded > 10 ? 'warning' : avgHoursNeeded > 8 ? 'info' : 'success',
                icon: avgHoursNeeded > 10 ? '⚠️' : avgHoursNeeded > 8 ? '💼' : '✅',
                title: 'Recommended Schedule',
                body: avgHoursNeeded > 10 
                    ? `Warning: You need to average ${avgHoursNeeded.toFixed(1)} hours per day, which is quite high. Consider if this is sustainable or if you need to adjust your weekly target.`
                    : avgHoursNeeded > 8
                    ? `You'll need to work ${avgHoursNeeded.toFixed(1)} hours per day on average. This is manageable but plan for longer days.`
                    : `Great news! You only need ${avgHoursNeeded.toFixed(1)} hours per day on average. This leaves room for flexibility!`,
                schedule: scheduleSuggestion
            });
            
            // Check constraints
            const constraintWarnings = checkConstraints(scheduleSuggestion);
            if (constraintWarnings.length > 0) {
                suggestions.push({
                    type: 'warning',
                    icon: '🚧',
                    title: 'Constraint Conflicts',
                    body: 'The following constraints may conflict with your schedule:',
                    list: constraintWarnings
                });
            }
            
            // Work pattern analysis
            if (workedDays.length > 0) {
                const avgWorked = workedDays.reduce((sum, d) => sum + d.hours, 0) / workedDays.length;
                const consistency = analyzeConsistency(workedDays);
                
                suggestions.push({
                    type: 'info',
                    icon: '📈',
                    title: 'Work Pattern Analysis',
                    body: `Your average work day so far is ${avgWorked.toFixed(1)} hours. ${consistency}`
                });
            }
        }
    }
    
    // Render suggestions
    suggestions.forEach(suggestion => {
        const card = document.createElement('div');
        card.className = `card suggestion-card ${suggestion.type}`;
        
        let scheduleHTML = '';
        if (suggestion.schedule) {
            scheduleHTML = `
                <div class="suggested-schedule">
                    <strong>Suggested Schedule:</strong>
                    ${suggestion.schedule.map(day => `
                        <div class="schedule-day">
                            <span><strong>${day.day}:</strong> ${day.start} - ${day.end}</span>
                            <span>${day.hours.toFixed(1)} hours</span>
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        let listHTML = '';
        if (suggestion.list) {
            listHTML = `
                <ul style="margin-top: 12px; padding-left: 20px;">
                    ${suggestion.list.map(item => `<li>${item}</li>`).join('')}
                </ul>
            `;
        }
        
        card.innerHTML = `
            <div class="suggestion-header">
                <span class="suggestion-icon">${suggestion.icon}</span>
                <span class="suggestion-title">${suggestion.title}</span>
            </div>
            <div class="suggestion-body">
                ${suggestion.body}
                ${scheduleHTML}
                ${listHTML}
            </div>
        `;
        
        container.appendChild(card);
    });
}

function generateOptimalSchedule(remainingHours, unworkedDays) {
    const prefs = workData.preferences;
    const idealStart = prefs.idealStart;
    const idealEnd = prefs.idealEnd;
    const earliestStart = prefs.earliestStart;
    const latestEnd = prefs.latestEnd;
    
    const idealDayLength = calculateHoursBetween(idealStart, idealEnd);
    const maxDayLength = calculateHoursBetween(earliestStart, latestEnd);
    
    const schedule = [];
    let hoursLeft = remainingHours;
    
    unworkedDays.forEach((day, index) => {
        const dayIndex = workData.dailyHours.indexOf(day);
        const dayConstraint = workData.constraints.find(c => c.day === dayIndex);
        
        let dayHours, startTime, endTime;
        
        // Check if this is the last day
        const isLastDay = index === unworkedDays.length - 1;
        
        if (isLastDay) {
            dayHours = hoursLeft;
        } else {
            dayHours = Math.min(idealDayLength, hoursLeft / (unworkedDays.length - index));
        }
        
        // Apply constraints
        if (dayConstraint) {
            if (dayConstraint.type === 'mustLeaveBy') {
                endTime = dayConstraint.value;
                const maxPossibleHours = calculateHoursBetween(earliestStart, endTime);
                dayHours = Math.min(dayHours, maxPossibleHours);
                startTime = subtractHours(endTime, dayHours);
            } else if (dayConstraint.type === 'mustStartAfter') {
                startTime = dayConstraint.value;
                const maxPossibleHours = calculateHoursBetween(startTime, latestEnd);
                dayHours = Math.min(dayHours, maxPossibleHours);
                endTime = addHours(startTime, dayHours);
            } else if (dayConstraint.type === 'maxHours') {
                dayHours = Math.min(dayHours, parseFloat(dayConstraint.value));
                startTime = idealStart;
                endTime = addHours(startTime, dayHours);
            }
        } else {
            // No constraints, use ideal times
            startTime = idealStart;
            endTime = addHours(startTime, dayHours);
            
            // Check if it exceeds preferences
            if (calculateHoursBetween(startTime, endTime) > maxDayLength) {
                startTime = earliestStart;
                endTime = latestEnd;
                dayHours = maxDayLength;
            }
        }
        
        schedule.push({
            day: day.day || dayNames[dayIndex],
            start: startTime,
            end: endTime,
            hours: dayHours
        });
        
        hoursLeft -= dayHours;
    });
    
    return schedule;
}

function addHours(time, hours) {
    const [hour, min] = time.split(':').map(Number);
    const totalMinutes = (hour * 60) + min + (hours * 60);
    const newHour = Math.floor(totalMinutes / 60) % 24;
    const newMin = Math.floor(totalMinutes % 60);
    return `${String(newHour).padStart(2, '0')}:${String(newMin).padStart(2, '0')}`;
}

function subtractHours(time, hours) {
    const [hour, min] = time.split(':').map(Number);
    let totalMinutes = (hour * 60) + min - (hours * 60);
    if (totalMinutes < 0) totalMinutes += 24 * 60;
    const newHour = Math.floor(totalMinutes / 60) % 24;
    const newMin = Math.floor(totalMinutes % 60);
    return `${String(newHour).padStart(2, '0')}:${String(newMin).padStart(2, '0')}`;
}

function checkConstraints(schedule) {
    const warnings = [];
    const prefs = workData.preferences;
    
    schedule.forEach(day => {
        if (day.start < prefs.earliestStart) {
            warnings.push(`${day.day}: Starts at ${day.start}, which is before your earliest preferred start time (${prefs.earliestStart})`);
        }
        if (day.end > prefs.latestEnd) {
            warnings.push(`${day.day}: Ends at ${day.end}, which is after your latest preferred end time (${prefs.latestEnd})`);
        }
        if (day.hours > 10) {
            warnings.push(`${day.day}: ${day.hours.toFixed(1)} hours is a very long work day`);
        }
    });
    
    return warnings;
}

function analyzeConsistency(workedDays) {
    const hours = workedDays.map(d => d.hours);
    const avg = hours.reduce((a, b) => a + b, 0) / hours.length;
    const variance = hours.reduce((sum, h) => sum + Math.pow(h - avg, 2), 0) / hours.length;
    const stdDev = Math.sqrt(variance);
    
    if (stdDev < 1) {
        return "Your work hours are very consistent, which is great for routine!";
    } else if (stdDev < 2) {
        return "You have moderate variation in your work hours, offering good flexibility.";
    } else {
        return "Your work hours vary significantly. This offers maximum flexibility but may be harder to maintain a routine.";
    }
}