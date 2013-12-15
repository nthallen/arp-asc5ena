var cur_sequence = { curstep: 0, seq: [], executed: 0 };

function sequence_init(seq) {
  cur_sequence.seq = seq;
  cur_sequence.curstep = 0;
  cur_sequence.executed = 0;
  set_status(cur_sequence.seq[0].Status);
  setTimeout(sequence_exec, 200);
}

function sequence_exec() {
  if (cur_sequence.curstep < cur_sequence.seq.length) {
    if (cur_sequence.executed) {
      //alert("Current sequence executed: " + cur_sequence.seq[cur_sequence.curstep].Status);
    } else {
      var isAsync = cur_sequence.seq[cur_sequence.curstep].Async;
      cur_sequence.executed = 1;
      cur_sequence.seq[cur_sequence.curstep].Function();
      if (isAsync) {
        return 0;
      }
    }
    cur_sequence.executed = 0;
    if (++cur_sequence.curstep >= cur_sequence.seq.length) {
      set_status("Ready");
    } else {
      set_status(cur_sequence.seq[cur_sequence.curstep].Status);
      setTimeout(sequence_exec, 200);
    }
  } else {
    set_status("Ready");
  }
}
