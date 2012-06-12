/**
 * Min: <draft>
 * [ar-kr]
 */
"use strict";

var timbre = require("../src/timbre");
// __BEGIN__

var Min = (function() {
    var Min = function() {
        initialize.apply(this, arguments);
    }, $this = Min.prototype;
    
    timbre.fn.setPrototypeOf.call($this, "ar-kr");
    
    var initialize = function(_args) {
        this.args = timbre.fn.valist.call(this, _args);
    };
    
    $this.seq = function(seq_id) {
        var _ = this._;
        var args, cell;
        var mul, add;
        var tmp, x, i, imax, j, jmax;
        
        cell = this.cell;
        if (seq_id !== this.seq_id) {
            this.seq_id = seq_id;
            args = this.args.slice(0);
            mul  = _.mul;
            add  = _.add;
            jmax = timbre.cellsize;
            
            if (_.ar) {
                if (args.length > 0) {
                    tmp = args[0].seq(seq_id);
                    for (j = jmax; j--; ) {
                        cell[j] = tmp[j];
                    }
                    for (i = 1, imax = args.length; i < imax; ++i) {
                        tmp = args[i].seq(seq_id);
                        for (j = jmax; j--; ) {
                            if (cell[j] > tmp[j]) cell[j] = tmp[j];
                        }
                    }
                } else {
                    for (j = jmax; j--; ) {
                        cell[j] = 0;
                    }
                }
                for (j = jmax; j--; ) {
                    cell[j] = cell[j] * mul + add;
                }
            } else {
                if (args.length > 0) {
                    x = args[0].seq(seq_id)[0];
                    for (i = 1, imax = args.length; i < imax; ++i) {
                        tmp = args[i].seq(seq_id)[0];
                        if (x > tmp) x = tmp;
                    }
                } else {
                    x = 0;
                }
                x = x * mul + add;
                for (j = jmax; j--; ) {
                    cell[j] = x;
                }
            }
        }
        return cell;
    };
    
    return Min;
}());
timbre.fn.register("min", Min);

// __END__
if (module.parent && !module.parent.parent) {
    describe("min", function() {
        object_test(Min, "min");
        describe("seq", function() {
            it("ar", function() {
                var instance = timbre("min", 0, -1);
                instance.seq(0).should.eql(timbre(-1).cell);
            });
            it("kr", function() {
                var instance = timbre("min", 0, -1).kr();
                instance.seq(0).should.eql(timbre(-1).cell);
            });
        });
    });
}
