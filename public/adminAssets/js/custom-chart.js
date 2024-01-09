(function ($) {
    

    if ($('#myChart').length) {
        var ctx1 = document.getElementById('myChart').getContext('2d');
    
        let jan = document.getElementById('jan').value
        let feb = document.getElementById('feb').value
        let mar = document.getElementById('mar').value
        let apr = document.getElementById('apr').value
        let may = document.getElementById('may').value
        let jun = document.getElementById('jun').value
        let jul = document.getElementById('jul').value
        let aug = document.getElementById('aug').value
        let sep = document.getElementById('sep').value
        let oct = document.getElementById('oct').value
        let nov = document.getElementById('nov').value
        let dec = document.getElementById('dec').value
    
        let year2018 = document.getElementById('2018').value;
        let year2019 = document.getElementById('2019').value;
        let year2020 = document.getElementById('2020').value;
        let year2021 = document.getElementById('2021').value;
        let year2022 = document.getElementById('2022').value;
        let year2023 = document.getElementById('2023').value;
        let year2024 = document.getElementById('2024').value;

        let Jan = document.getElementById('Jan').value;
        let Feb = document.getElementById('Feb').value;
        let Mar = document.getElementById('Mar').value;
        let Apr = document.getElementById('Apr').value;
        let May = document.getElementById('May').value;
        let Jun = document.getElementById('Jun').value;
        let Jul = document.getElementById('Jul').value;
        let Aug = document.getElementById('Aug').value;
        let Sep = document.getElementById('Sep').value;
        let Oct = document.getElementById('Oct').value;
        let Nov = document.getElementById('Nov').value;
        let Dec = document.getElementById('Dec').value;

        let order2018 = document.getElementById('order2018').value;
        let order2019 = document.getElementById('order2019').value;
        let order2020 = document.getElementById('order2020').value;
        let order2021 = document.getElementById('order2021').value;
        let order2022 = document.getElementById('order2022').value;
        let order2023 = document.getElementById('order2023').value;
        let order2024 = document.getElementById('order2024').value;

        let JanUsers = document.getElementById('JAN').value;
        let FebUsers = document.getElementById('FEB').value;
        let MarUsers = document.getElementById('Mar').value;
        let AprUsers = document.getElementById('APR').value;
        let MayUsers = document.getElementById('MAY').value;
        let JunUsers = document.getElementById('JUN').value;
        let JulUsers = document.getElementById('JUL').value;
        let AugUsers = document.getElementById('AUG').value;
        let SepUsers = document.getElementById('SEP').value;
        let OctUsers = document.getElementById('OCT').value;
        let NovUsers = document.getElementById('NOV').value;
        let DecUsers = document.getElementById('DEC').value;

        let users2018 = document.getElementById('users2018').value;
        let users2019 = document.getElementById('users2019').value;
        let users2020 = document.getElementById('users2020').value;
        let users2021 = document.getElementById('users2021').value;
        let users2022 = document.getElementById('users2022').value;
        let users2023 = document.getElementById('users2023').value;
        let users2024 = document.getElementById('users2024').value;



        // Initial data for the chart
        var initialData1 = {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [
                {
                    label: 'Sales',
                    tension: 0.3,
                    fill: true,
                    backgroundColor: 'rgba(44, 120, 220, 0.2)',
                    borderColor: 'rgba(44, 120, 220)',
                    data: [jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, dec]
                },
                {
                    label: 'Orders',
                    tension: 0.3,
                    fill: true,
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgba(255, 99, 132)',
                    data: [Jan, Feb, Mar, Apr, May, Jun, Jul, Aug, Sep, Oct, Nov, Dec]
                },
                {
                    label: 'Users',
                    tension: 0.3,
                    fill: true,
                    backgroundColor: 'rgba(4, 209, 130, 0.2)',
                    borderColor: 'rgb(4, 209, 130)',
                    data: [JanUsers, FebUsers, MarUsers, AprUsers, MayUsers, JunUsers, JulUsers, AugUsers, SepUsers, OctUsers, NovUsers, DecUsers]
                  }
                  
            ]
        };
    
        var chartOptions1 = {
            plugins: {
                legend: {
                    labels: {
                        usePointStyle: true,
                    },
                }
            }
        };
    
        var chart1 = new Chart(ctx1, {
            type: 'line',
            data: initialData1,
            options: chartOptions1
        });
    
        // Monthly and yearly data
        var monthlyData = [jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, dec];
        var yearlyData = [year2018, year2019, year2020, year2021, year2022, year2023, year2024];

        var monthlyOrderData = [Jan, Feb, Mar, Apr, May, Jun, Jul, Aug, Sep, Oct, Nov, Dec];
        var yearlyOrderData = [order2018, order2019, order2020, order2021, order2022, order2023 ,order2024 ];

        var monthlyUserData = [JanUsers, FebUsers, MarUsers, AprUsers, MayUsers, JunUsers, JulUsers, AugUsers, SepUsers, OctUsers, NovUsers, DecUsers];
        var yearlyUserData = [users2018, users2019, users2020, users2021, users2022, users2023, users2024]
    
        // Click event for elements with the class "toggle-chart"
        $('.toggle-chart').on('click', function () {
            var chartType = $(this).data('chart-type');
            var labels1 = chartType === 'monthly' ?
                ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] :
                Array.from({ length: 2024 - 2018 + 1 }, (_, i) => (2018 + i).toString());
    
            // Update data based on chart type
            var newData = chartType === 'monthly' ? monthlyData : yearlyData;
            var newOrderData = chartType === 'monthly' ? monthlyOrderData : yearlyOrderData;
            var newUsersData = chartType === 'monthly' ? monthlyUserData : yearlyUserData;
    
            // Update dataset values for both Sales and Orders
            chart1.data.datasets[0].data = newData; // Sales data
            chart1.data.datasets[1].data = newOrderData; // Orders data
            chart1.data.datasets[2].data = newUsersData; // Orders data
    
            // Update labels for the dataset
            chart1.data.labels = labels1;
    
            // Update the chart
            chart1.update();
        });
    }
    
    
    
    

    /*Sale statistics Chart*/
    if ($('#myChart2').length) {
        var ctx = document.getElementById("myChart2");
        var myChart = new Chart(ctx, {
            type: 'bar',
            data: {
            labels: ["900", "1200", "1400", "1600"],
            datasets: [
                {
                    label: "US",
                    backgroundColor: "#5897fb",
                    barThickness:10,
                    data: [233,321,783,900]
                }, 
                {
                    label: "Europe",
                    backgroundColor: "#7bcf86",
                    barThickness:10,
                    data: [408,547,675,734]
                },
                {
                    label: "Asian",
                    backgroundColor: "#ff9076",
                    barThickness:10,
                    data: [208,447,575,634]
                },
                {
                    label: "Africa",
                    backgroundColor: "#d595e5",
                    barThickness:10,
                    data: [123,345,122,302]
                },
            ]
            },
            options: {
                plugins: {
                    legend: {
                        labels: {
                        usePointStyle: true,
                        },
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    } //end if
    
})(jQuery);