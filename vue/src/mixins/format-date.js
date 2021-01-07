export default {
    methods: {
        makeDate(inval) {
            // convert strings and integers to date objects if required.
            if (typeof (inval) == 'string') {
                return new Date(inval)
            } else if (typeof (inval) == 'number') {
                if (inval > 2147483647) {
                    // this is a javascript timestamp
                    return new Date(inval)
                }
                // most likely it's a unix timestamp
                return (new Date(inval * 1000));
            }

            // it's a date already, or we have no clue what it is
            return inval;
        },
        fullDateTime(dateValue) {
            dateValue = this.makeDate(dateValue);
            let pad = (number) => ("0" + number).slice(-2);
            return dateValue.getFullYear() + "-" +
                pad(dateValue.getMonth() + 1) + "-" +
                pad(dateValue.getDate()) + " " +
                pad(dateValue.getHours()) + ":" +
                pad(dateValue.getMinutes()) + ":" +
                pad(dateValue.getSeconds());
        },
        dateOnly(dateValue) {
            // render the date only for humans to read (in local time).
            dateValue = this.makeDate(dateValue);
            let pad = (number) => ("0" + number).slice(-2);
            return dateValue.getFullYear() + "-" +
                pad(dateValue.getMonth() + 1) + "-" +
                pad(dateValue.getDate());
        },
        shortDayName(dateValue) {
            dateValue = this.makeDate(dateValue);
            let shortDayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
            return shortDayNames[dateValue.getDay()]
        },
        localIsoDateOnly(dateValue) {
            // a standard format of YYYY-MM-DD (it is currently the same format as dateOnly,
            // but dateOnly could change so use this for machine readable dates).
            // This should render the date in local time.
            dateValue = this.makeDate(dateValue);
            let pad = (number) => ("0" + number).slice(-2);
            return dateValue.getFullYear() + "-" +
                pad(dateValue.getMonth() + 1) + "-" +
                pad(dateValue.getDate());
        },

    },
};
