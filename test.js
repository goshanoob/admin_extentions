// Имена статистических параметров для суммирования.
const STATS_NAMES_TO_SUM = ["givenDamage", "odometer"];
// Имена статистических параметров для вывода рейтинга.
const STATS_NAMES_FOR_TOP = ["givenDamage", "odometer"];
// Количество строк в рейтинге.
const TOP_COUNT = 10;

const ROW_LIMIT_PER_REQUEST = 150;

let _logs = [];
let previousProgress = -1;

startLoad();

async function startLoad() {
    const filters = getFiltersFromPage();
    const filtredLogsCount = await getLogsCountByFilters(filters);

    console.log(`Обнаружежно ${filtredLogsCount} логов. Последует их загрузка...`);

    let loadedPages = 1;
    const pagesCount = Math.floor(filtredLogsCount / ROW_LIMIT_PER_REQUEST);
    const onPageLoaded = _ => drawProgress(loadedPages, pagesCount);

    loadPageNumberWithFilter(loadedPages, filters, onPageLoaded);
    calculateSumStat();
    sortAndShowTopByOneRound();
}

function getFiltersFromPage() {
    const filters = [];
    const isFunction = obj => !!(obj && obj.constructor && obj.call && obj.apply);

    $.each(viewModel.datatable.filters, function (key, val) {
        if (isFunction(val) && val()) {
            _filters.push({ field: key, value: val() });
        }
    });

    return filters;
}

async function getLogsCountByFilters(filters) {
    return new Promise((resolve, reject) => {
        $.ajax({
            type: 'GET',
            url: viewModel.datatable.urls.load,
            cache: false,
            dataType: 'json',
            data: { page: 1, limit: 1, filters: filters },
            success: function (response) {
                resolve(response && response.total_count ? response.total_count : 0);
            },
            error: function (xhr, ajaxOptions, thrownError) {
                console.error(xhr, ajaxOptions, thrownError);
                reject(0);
            },
        });
    });
}

async function loadPageNumberWithFilter(pageNumber, filters, onProgress) {
    var data = {
        page: pageNumber,
        limit: ROW_LIMIT_PER_REQUEST,
        filters: filters
    };

    $.ajax({
        type: 'GET',
        url: viewModel.datatable.urls.load,
        cache: false,
        dataType: 'json',
        data: data,
        success: function (response) {
            if (response && response.items) {
                _logs = _logs.concat(response.items);
            }
            onProgress();
            resolve();
        },
        error: function (xhr, ajaxOptions, thrownError) {
            console.error(xhr, ajaxOptions, thrownError);
            reject(thrownError);
        },
    });
}

function calculateSumStat() {
    STATS_NAMES_TO_SUM.forEach(statName => {
        _logs = _logs.filter(item => item.data.hasOwnProperty("stats"));
        const statSum = _logs.reduce((sum, item) => sum + item.data.stats[statName], 0);
        console.log(`%c Сумма по параметру ${statName} равна ${statSum}. Рассмотрено ${_logs.length} игорьков. `, "background: #FFCC00;");
    });
}

function sortAndShowTopByOneRound() {
    const printTopByStat = statName => {
        console.log(`%c ULTIMATE TOP ROUND >>> ${statName} <<< ROUND TOP ULTIMATE `, "background: #964B00; color: #FFCC00;");
        for (let i = 0; i < TOP_COUNT; i++) {
            let player = _logs[i].player;
            let data = _logs[i].data;
            console.log(`${i + 1}. ${player.nick_name} (${player.id}) - ${data.stats[statName]} (${data.battleId})`);
        }
    };

    STATS_NAMES_FOR_TOP.forEach(statName => {
        _logs.sort((first, second) => second.data.stats[statName] - first.data.stats[statName]);
        printTopByStat(statName);
    }
    );
}


function drawProgress(currentPage, pagesCount) {
    const loadPortion = currentPage / pagesCount;
    const progress = parseInt(loadPortion * 10);

    if (progress !== previousProgress) {
        console.log(`Прогресс: [${"#".repeat(progress)}${" ".repeat(10 - progress)}]`)
        previousProgress = progress;
    }

    printLoadState(loadPortion);
}

function printLoadState(loadPortion) {
    const currentProgress = loadPortion.toFixed(2);
    const progressMessages = {
        "0.30": "Процесс идет во всю...",
        "0.60": "Еще немного...",
        "0.90": "Уже вот-вот..."
    };

    if (progressMessages.hasOwnProperty(currentProgress)) {
        console.log(progressMessages[currentProgress]);
    }
}
